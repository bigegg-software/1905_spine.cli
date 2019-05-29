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

    let aliyunCliCreateEciArgs = ['eci', 'CreateContainerGroup']
    res = spawnSync('aliyun' , aliyunCliCreateEciArgs, {
        shell: true ,
        stdio: 'inherit',
        cwd: tmpDir
    });
    aliyunCliCreateEciArgs.push('--RegionId', netConf.region_id)
    aliyunCliCreateEciArgs.push('--SecurityGroupId', netConf.securitygroup_id)
    aliyunCliCreateEciArgs.push('--VSwitchId', netConf.vswitch_id)
    aliyunCliCreateEciArgs.push('--ZoneId', netConf.zone_id) 
    aliyunCliCreateEciArgs.push('--EipInstanceId', netConf.eip_id)
    aliyunCliCreateEciArgs.push('--ContainerGroupName', `${name}-dev`)

    aliyunCliCreateEciArgs.push('--Container.1.Image', 'mongo:4.0.5')
    aliyunCliCreateEciArgs.push('--Container.1.Name', 'mongo')
    aliyunCliCreateEciArgs.push('--Container.1.Cpu', '1')
    aliyunCliCreateEciArgs.push('--Container.1.Memory', '1')
    aliyunCliCreateEciArgs.push('--Container.1.Port.1.Protocol', 'TCP')
    aliyunCliCreateEciArgs.push('--Container.1.Port.1.Port', '27017')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.1.Key', 'PATH')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.1.Value', '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.2.Key', 'GOSU_VERSION')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.2.Value', '1.10')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.3.Key', 'JSYAML_VERSION')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.3.Value', '3.10.0')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.4.Key', 'GPG_KEYS')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.4.Value', '9DA31620334BD75D9DCB49F368818C72E52529D4')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.5.Key', 'MONGO_PACKAGE')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.5.Value', 'mongodb-org')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.6.Key', 'MONGO_REPO')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.6.Value', 'repo.mongodb.org')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.7.Key', 'MONGO_MAJOR')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.7.Value', '4.0')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.8.Key', 'MONGO_VERSION')
    aliyunCliCreateEciArgs.push('--Container.1.EnvironmentVar.8.Value', '4.0.5')
    aliyunCliCreateEciArgs.push('--Container.2.Image', 'parseplatform/parse-server')
    aliyunCliCreateEciArgs.push('--Container.2.Name', 'parse-server')
    aliyunCliCreateEciArgs.push('--Container.2.Cpu', '1')
    aliyunCliCreateEciArgs.push('--Container.2.Memory', '1')
    aliyunCliCreateEciArgs.push('--Container.2.Port.1.Protocol', 'TCP')
    aliyunCliCreateEciArgs.push('--Container.2.Port.1.Port', '1337')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.1.Key', 'PARSE_SERVER_APPLICATION_ID')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.1.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.2.Key', 'PARSE_SERVER_APP_NAME')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.2.Value', 'example-eci')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.3.Key', 'PARSE_SERVER_MASTER_KEY')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.3.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.4.Key', 'PARSE_SERVER_READ_ONLY_MASTER_KEY')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.4.Value', '1234567')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.5.Key', 'PARSE_SERVER_CLIENT_KEY')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.5.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.6.Key', 'PARSE_SERVER_JAVASCRIPT_KEY')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.6.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.7.Key', 'PARSE_SERVER_WEBHOOK_KEY')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.7.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.8.Key', 'PARSE_SERVER_DATABASE_URI')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.8.Value', 'mongodb://example-eci-parseserver:27017/parse')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.9.Key', 'PARSE_SERVER_MOUNT_PATH')
    aliyunCliCreateEciArgs.push('--Container.2.EnvironmentVar.9.Value', '/')
    aliyunCliCreateEciArgs.push('--Container.3.Image', 'parseplatform/parse-dashboard')
    aliyunCliCreateEciArgs.push('--Container.3.Name', 'parse-dashbord')
    aliyunCliCreateEciArgs.push('--Container.3.Cpu', '1')
    aliyunCliCreateEciArgs.push('--Container.3.Memory', '1')
    aliyunCliCreateEciArgs.push('--Container.3.Port.1.Protocol', 'TCP')
    aliyunCliCreateEciArgs.push('--Container.3.Port.1.Port', '4040')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.1.Key', 'PORT')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.1.Value', '4040')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.2.Key', 'MOUNT_PATH')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.2.Value', '/')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.3.Key', 'PARSE_DASHBOARD_SERVER_URL')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.3.Value', '"http://$eip_ip:1337"')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.4.Key', 'PARSE_DASHBOARD_MASTER_KEY')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.4.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.5.Key', 'PARSE_DASHBOARD_APP_ID')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.5.Value', '123456')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.6.Key', 'PARSE_DASHBOARD_APP_NAME')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.6.Value', 'example-eci')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.7.Key', 'PARSE_DASHBOARD_USER_ID')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.7.Value', 'admin')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.8.Key', 'PARSE_DASHBOARD_USER_PASSWORD')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.8.Value', 'Admin1234')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.9.Key', 'PARSE_DASHBOARD_ALLOW_INSECURE_HTTP')
    aliyunCliCreateEciArgs.push('--Container.3.EnvironmentVar.9.Value', 'true')
    console.log(tmpDir, res.status, res.error);
}

module.exports = {
    newapp
}


