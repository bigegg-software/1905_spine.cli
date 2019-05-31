'use strict';

const chalk = require('chalk')
const tempy = require('tempy');
const path = require('path');
const fs = require('fs');
const localConf = require('../localConf');

const { spawnSync } = require('child_process');

const networkConfDir = path.join(__dirname, '..', '..', 'resources', 'aliyun_network')


async function newapp(name) {

    //TODO: generate appId masterkey and render from zygote

    //TODO: check .ssh exist
    const dotSshDir = path.join(process.env['HOME'], '.ssh')
    const idRsa = fs.readFileSync(path.join(dotSshDir, 'id_rsa'))
    const idRsaPub = fs.readFileSync(path.join(dotSshDir, 'id_rsa.pub'))

    //TODO prompt for repo url
    const gitRepoUrl = 'git@github.com:bigegg-software/BServer.zygote.git'

    //TODO ide password
    const idePassword = 'jones0036'

    return ;
    const tmpDir = tempy.directory();
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

    let ramAk= userSecrets.AccessKeySecret;
    let ramSk = userSecrets.AccessKeyId;

    fs.unlinkSync(userSecretFile);


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
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.1.Key', 'GIT_REPO_URL')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.1.Value', gitRepoUrl)
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
}

module.exports = {
    newapp
}


