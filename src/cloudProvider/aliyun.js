'use strict';

const git = require('simple-git/promise')

const chalk = require('chalk')
const nanoid = require("nanoid");
const prompts = require("prompts");

const tempy = require('tempy');
const path = require('path');
const fs = require('fs');
const localConf = require('../localConf');
const { renderAllTemplates, downloadAndUnzipZygote } = require('../util')
const { spawnSync } = require('child_process');

const networkConfDir = path.join(__dirname, '..', '..', 'resources', 'aliyun_network')

const DEFAULT_ZYGOTE_TGZ_URL = 'https://github.com/bigegg-software/BServer.zygote/archive/v0.9.tar.gz';

async function newapp(name) {

    const dotSshDir = path.join(process.env['HOME'], '.ssh')
    if (!fs.existsSync(path.join(dotSshDir, 'id_rsa')) 
        || !fs.existsSync(path.join(dotSshDir, 'id_rsa.pub')))
    {
        console.log(chalk.red("Please generate ssh keys, eg. using ssh-keygen,  and rerun again."))
        throw "need id_rsa pub/private keys"
    }

    let idRsa = fs.readFileSync(path.join(dotSshDir, 'id_rsa'))
    let idRsaPub = fs.readFileSync(path.join(dotSshDir, 'id_rsa.pub'))


    const tmpDir = tempy.directory();


    let response = null;
    response = await prompts({
        type: 'text',
        name: 'url',
        message: 'ZygoteUrl?',
        initial: DEFAULT_ZYGOTE_TGZ_URL
    });


    let zygoteUrl = response.url;
    if (!zygoteUrl) {
        throw 'user aborted'
    }
    const zygoteDir = path.join(tmpDir, 'zygote')
    fs.mkdirSync(zygoteDir)
    await downloadAndUnzipZygote(zygoteUrl, zygoteDir);

//    prompts.inject(['git@github.com:Jones0036/spine-app-test.git'])

    response = await prompts({
        type: 'text',
        name: 'url',
        message: 'Your app Git repo url?(Please use an existing and  empty repo).',
    });

    const gitRepoUrl = response.url
    let codeDir = null;

    if (gitRepoUrl) {

        console.log(chalk.yellow("your ssh pubkey:"))
        console.log("    " + idRsaPub.toString());
        console.log("")
        console.log(chalk.yellow("Please add it to your git repo. It will be needed soon."))

        response = await prompts({
            type: 'confirm',
            name: 'value',
            message: 'Please confirm that ssh pubkey is added to the git repo.',
            initial: true
        });

        if (!response.value) {
            throw 'user aborted'
        }
        codeDir = path.join(tmpDir, 'code')
        await git().clone(gitRepoUrl, codeDir)
    }

    response = await prompts({
        type: 'password',
        name: 'pw',
        message: 'Set a password for IDE'
    });

    const idePassword = response.pw

    let res = spawnSync('cp' , [path.join(networkConfDir, '*.tf'), tmpDir], { shell: true })
    if (res.status !== 0) {
        console.error(res.error);
        throw "copy tf conf to tmp dir failed"
    }




    res = spawnSync('terraform' , ['init'], {
        shell: true ,
        stdio: 'inherit',
        cwd: tmpDir
    })
    if (res.status !== 0) {
        console.error(res.error);
        throw "terraform init failed"
    }

    const userSecretFile = path.join(tmpDir, 'user_secret')
    let tfApplyArgs = ['apply', '-auto-approve',
        '-var', `app_name=${name}`,
        '-var', `user_secret_file=${userSecretFile}`,
    ];
    res = spawnSync('terraform' , tfApplyArgs, {
        shell: true ,
        stdio: 'inherit',
        cwd: tmpDir
    })
    if (res.status !== 0) {
        console.error(res.error);
        throw "terraform apply failed"
    }

    res = spawnSync('terraform' , ['output', '-json'], {
        shell: true,
        stdio: ['inherit', 'pipe', 'inherit'],
        cwd: tmpDir
    })

    if (res.status !== 0) {
        console.error(res.error);
        throw "terraform output failed"
    }

    let tfRes = {};

    let rawConf = JSON.parse(res.stdout.toString());
    
    for (let key in rawConf) {
        if (rawConf[key] && rawConf[key].value !== undefined) {
            tfRes[key] = rawConf[key].value
        }
    }

    let userSecrets = JSON.parse(fs.readFileSync(userSecretFile));

    let ramAk = userSecrets.AccessKeyId;
    let ramSk = userSecrets.AccessKeySecret;

    fs.unlinkSync(userSecretFile);

    const ctx = {
        name,
        "appId": nanoid(24),
        "masterKey": nanoid(24),
        "bucket": tfRes.bucket_name,
        "s3BaseUrl": tfRes.bucket_base_url,
        "s3Region": tfRes.region_id,
        "s3Ak": ramAk,
        "s3Sk": ramSk,
        "s3Endpoint": tfRes.bucket_endpoint
    }

    console.log('app ctx', ctx);


    if (codeDir) {
        await downloadAndUnzipZygote(zygoteUrl, codeDir);
        await renderAllTemplates(ctx, codeDir);

        let gitCtx = git(codeDir);
        await gitCtx.add(codeDir);
        await gitCtx.commit('spine zygote')
        await gitCtx.push('origin', 'master')
    }




    let aliyunCliCreateEciArgs = ['eci', 'CreateContainerGroup']

    aliyunCliCreateEciArgs.push('--RegionId', tfRes.region_id)
    aliyunCliCreateEciArgs.push('--SecurityGroupId', tfRes.securitygroup_id)
    aliyunCliCreateEciArgs.push('--VSwitchId', tfRes.vswitch_id)
    aliyunCliCreateEciArgs.push('--ZoneId', tfRes.zone_id) 
    aliyunCliCreateEciArgs.push('--EipInstanceId', tfRes.eip_id)
    aliyunCliCreateEciArgs.push('--ContainerGroupName', `${name}-dev`)

    aliyunCliCreateEciArgs.push('--Volume.1.Name', 'sshConf');
    aliyunCliCreateEciArgs.push('--Volume.1.Type', 'ConfigFileVolume');
    aliyunCliCreateEciArgs.push('--Volume.1.ConfigFileVolume.ConfigFileToPath.1.Path', 'id_rsa')
    aliyunCliCreateEciArgs.push('--Volume.1.ConfigFileVolume.ConfigFileToPath.1.Content', idRsa.toString('base64'))
    aliyunCliCreateEciArgs.push('--Volume.1.ConfigFileVolume.ConfigFileToPath.2.Path', 'id_rsa.pub')
    aliyunCliCreateEciArgs.push('--Volume.1.ConfigFileVolume.ConfigFileToPath.2.Content', idRsaPub.toString('base64'))


    aliyunCliCreateEciArgs.push('--Container.1.Image', 'registry.cn-hangzhou.aliyuncs.com/spine/codeserver:latest')
    aliyunCliCreateEciArgs.push('--Container.1.Name', 'codeserver')
    aliyunCliCreateEciArgs.push('--Container.1.Cpu', '1')
    aliyunCliCreateEciArgs.push('--Container.1.Memory', '2')
    aliyunCliCreateEciArgs.push('--Container.1.Port.1.Protocol', 'TCP')
    aliyunCliCreateEciArgs.push('--Container.1.Port.1.Port', '8443')
    aliyunCliCreateEciArgs.push('--Container.1.Port.2.Protocol', 'TCP')
    aliyunCliCreateEciArgs.push('--Container.1.Port.2.Port', '1337')
    if (gitRepoUrl) {
        aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.1.Key', 'GIT_REPO_URL')
        aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.1.Value', gitRepoUrl)
    }
    aliyunCliCreateEciArgs.push('--Container.1.VolumeMount.1.Name', 'sshConf');
    aliyunCliCreateEciArgs.push('--Container.1.VolumeMount.1.ReadOnly', 'False');
    aliyunCliCreateEciArgs.push('--Container.1.VolumeMount.1.MountPath', '/home/coder/.ssh');


    aliyunCliCreateEciArgs.push('--Container.1.Arg.1=--password')
    aliyunCliCreateEciArgs.push('--Container.1.Arg.2', idePassword);
    res = spawnSync('aliyun' , aliyunCliCreateEciArgs, {
        shell: true ,
        stdio: 'inherit',
        cwd: tmpDir
    });


    console.log(tmpDir, res.status, res.error);

    console.log(chalk.green('Your IDE will be at: https://' + tfRes.eip_ip + ':8443'))
}

module.exports = {
    newapp
}


