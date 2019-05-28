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
    //check if in aliyun cloud shell
    let aliyunUa = process.env['ALIYUN_USER_AGENT'];
    if (aliyunUa && aliyunUa.toLowerCase().startsWith('cloudshell')) {
        console.log(chalk.green('Detected Aliyun Cloud Shell.'))
        console.log(chalk.green('Using aliyun.'))
        localConf.set('cloudProvider', 'aliyun');
        return;
    }

    throw "UNSUPPORTED ENV"
}

process.on('uncaughtException', e => {
    console.error(chalk.red(e))
    process.exit(1)
});
process.on('unhandledRejection', e => {
    console.error(chalk.red(e))
    process.exit(1)
});
