#!/usr/bin/env node
'use strict';

const program = require('commander')
const chalk = require('chalk')
const prompts = require('prompts')
const localConf = require('./localConf')

const newapp = require('./newapp')
const deployapp = require('./deployapp')

const cloud = require('./cloudProvider')

program
  .version('0.0.1')
  .description('Spine command line tool. ')

program
  .command('config')
  .description('config this cli tool')
  .action(exec_config)

program
  .command('newapp <app>')
  .description('create a new spine app.')
  .action(newapp.run);

program
  .command('deployapp <app>')
  .description('deploy app to prod env')
  .action(deployapp.run);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  console.log(require('./banner'))
  program.help();
}


async function exec_config() {

    let response = await prompts([{
        type: 'text',
        name: 'aliyunAk',
        message: 'aliyun AK?'
    },{
        type: 'text',
        name: 'aliyunSk',
        message: 'aliyun SK?'
    }]);

    localConf.set('cloud.aliyun.ak', response.aliyunAk)
    localConf.set('cloud.aliyun.sk', response.aliyunSk)

    //TODO prompt
    const _provider = 'aliyun';
    localConf.set('cloudProvider', _provider);
}

process.on('uncaughtException', e => {
    console.error(chalk.red(e))
    process.exit(1)
});
process.on('unhandledRejection', e => {
    console.error(chalk.red(e))
    process.exit(1)
});
