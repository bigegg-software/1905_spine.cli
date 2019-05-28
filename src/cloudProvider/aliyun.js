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

    res = spawnSync('terraform' , ['apply'], {
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
    let netConf = JSON.parse(res.stdout.toString())

    //res = spawnSync('terraform' , ['output', '-json'], {
    //aliyun eci CreateContainerGroup \
    //--RegionId "$region_id" \
    //--SecurityGroupId "$securitygroup_id" \
    //--VSwitchId "$vswitch_id" \
    //--ContainerGroupName example-eci-parseserver \
    //--ZoneId "$zone_id" \
    //--EipInstanceId "$eip_id" \
    //--Container.1.Image mongo:4.0.5 \
    //--Container.1.Name mongo \
    //--Container.1.Cpu 1 \
    //--Container.1.Memory 1 \
    //--Container.1.Port.1.Protocol TCP \
    //--Container.1.Port.1.Port 27017 \
    //--Container.1.EnvironmentVar.1.Key PATH \
    //--Container.1.EnvironmentVar.1.Value /usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
    //--Container.1.EnvironmentVar.2.Key GOSU_VERSION \
    //--Container.1.EnvironmentVar.2.Value 1.10 \
    //--Container.1.EnvironmentVar.3.Key JSYAML_VERSION \
    //--Container.1.EnvironmentVar.3.Value 3.10.0 \
    //--Container.1.EnvironmentVar.4.Key GPG_KEYS \
    //--Container.1.EnvironmentVar.4.Value 9DA31620334BD75D9DCB49F368818C72E52529D4 \
    //--Container.1.EnvironmentVar.5.Key MONGO_PACKAGE \
    //--Container.1.EnvironmentVar.5.Value mongodb-org \
    //--Container.1.EnvironmentVar.6.Key MONGO_REPO \
    //--Container.1.EnvironmentVar.6.Value repo.mongodb.org \
    //--Container.1.EnvironmentVar.7.Key MONGO_MAJOR \
    //--Container.1.EnvironmentVar.7.Value 4.0 \
    //--Container.1.EnvironmentVar.8.Key MONGO_VERSION \
    //--Container.1.EnvironmentVar.8.Value 4.0.5 \
    //--Container.2.Image parseplatform/parse-server \
    //--Container.2.Name parse-server \
    //--Container.2.Cpu 1 \
    //--Container.2.Memory 1 \
    //--Container.2.Port.1.Protocol TCP \
    //--Container.2.Port.1.Port 1337 \
    //--Container.2.EnvironmentVar.1.Key PARSE_SERVER_APPLICATION_ID \
    //--Container.2.EnvironmentVar.1.Value 123456 \
    //--Container.2.EnvironmentVar.2.Key PARSE_SERVER_APP_NAME \
    //--Container.2.EnvironmentVar.2.Value example-eci \
    //--Container.2.EnvironmentVar.3.Key PARSE_SERVER_MASTER_KEY \
    //--Container.2.EnvironmentVar.3.Value 123456 \
    //--Container.2.EnvironmentVar.4.Key PARSE_SERVER_READ_ONLY_MASTER_KEY \
    //--Container.2.EnvironmentVar.4.Value 1234567 \
    //--Container.2.EnvironmentVar.5.Key PARSE_SERVER_CLIENT_KEY \
    //--Container.2.EnvironmentVar.5.Value 123456 \
    //--Container.2.EnvironmentVar.6.Key PARSE_SERVER_JAVASCRIPT_KEY \
    //--Container.2.EnvironmentVar.6.Value 123456 \
    //--Container.2.EnvironmentVar.7.Key PARSE_SERVER_WEBHOOK_KEY \
    //--Container.2.EnvironmentVar.7.Value 123456 \
    //--Container.2.EnvironmentVar.8.Key PARSE_SERVER_DATABASE_URI \
    //--Container.2.EnvironmentVar.8.Value mongodb://example-eci-parseserver:27017/parse \
    //--Container.2.EnvironmentVar.9.Key PARSE_SERVER_MOUNT_PATH \
    //--Container.2.EnvironmentVar.9.Value / \
    //--Container.3.Image parseplatform/parse-dashboard \
    //--Container.3.Name parse-dashbord \
    //--Container.3.Cpu 1 \
    //--Container.3.Memory 1 \
    //--Container.3.Port.1.Protocol TCP \
    //--Container.3.Port.1.Port 4040 \
    //--Container.3.EnvironmentVar.1.Key PORT \
    //--Container.3.EnvironmentVar.1.Value 4040 \
    //--Container.3.EnvironmentVar.2.Key MOUNT_PATH \
    //--Container.3.EnvironmentVar.2.Value / \
    //--Container.3.EnvironmentVar.3.Key PARSE_DASHBOARD_SERVER_URL \
    //--Container.3.EnvironmentVar.3.Value "http://$eip_ip:1337" \
    //--Container.3.EnvironmentVar.4.Key PARSE_DASHBOARD_MASTER_KEY \
    //--Container.3.EnvironmentVar.4.Value 123456 \
    //--Container.3.EnvironmentVar.5.Key PARSE_DASHBOARD_APP_ID \
    //--Container.3.EnvironmentVar.5.Value 123456 \
    //--Container.3.EnvironmentVar.6.Key PARSE_DASHBOARD_APP_NAME \
    //--Container.3.EnvironmentVar.6.Value example-eci \
    //--Container.3.EnvironmentVar.7.Key PARSE_DASHBOARD_USER_ID \
    //--Container.3.EnvironmentVar.7.Value admin \
    //--Container.3.EnvironmentVar.8.Key PARSE_DASHBOARD_USER_PASSWORD \
    //--Container.3.EnvironmentVar.8.Value Admin1234 \
    //--Container.3.EnvironmentVar.9.Key PARSE_DASHBOARD_ALLOW_INSECURE_HTTP \
    //--Container.3.EnvironmentVar.9.Value true

    console.log(tmpDir, res.status, res.error);
}

module.exports = {
    newapp
}


