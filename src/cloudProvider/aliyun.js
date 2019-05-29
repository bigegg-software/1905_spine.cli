'use strict';

const chalk = require('chalk')
const tempy = require('tempy');
const path = require('path');
const localConf = require('../localConf');

const { spawnSync } = require('child_process');

const networkConfDir = path.join(__dirname, '..', '..', 'resources', 'aliyun_network')


async function newapp(name) {
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

    res = spawnSync('terraform' , ['apply', '-auto-approve', '-var', `vpc_name=${name}-dev`], {
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

    let netConf = {};

    let rawConf = JSON.parse(res.stdout.toString());
    
    for (let key in rawConf) {
        if (rawConf[key] && rawConf[key].value !== undefined) {
            netConf[key] = rawConf[key].value
        }
    }

    let cgroupName = `${name}-dev`;
    let aliyunCliCreateEciArgs = ['eci', 'CreateContainerGroup']

    aliyunCliCreateEciArgs.push('--RegionId', netConf.region_id)
    aliyunCliCreateEciArgs.push('--SecurityGroupId', netConf.securitygroup_id)
    aliyunCliCreateEciArgs.push('--VSwitchId', netConf.vswitch_id)
    aliyunCliCreateEciArgs.push('--ZoneId', netConf.zone_id) 
    aliyunCliCreateEciArgs.push('--EipInstanceId', netConf.eip_id)
    aliyunCliCreateEciArgs.push('--ContainerGroupName', cgroupName)

    aliyunCliCreateEciArgs.push('--Container.1.Image', 'monostream/code-server:latest')
    aliyunCliCreateEciArgs.push('--Container.1.Name', 'codeserver')
    aliyunCliCreateEciArgs.push('--Container.1.Cpu', '1')
    aliyunCliCreateEciArgs.push('--Container.1.Memory', '1')
    aliyunCliCreateEciArgs.push('--Container.1.Port.1.Protocol', 'TCP')
    aliyunCliCreateEciArgs.push('--Container.1.Port.1.Port', '8443')

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


