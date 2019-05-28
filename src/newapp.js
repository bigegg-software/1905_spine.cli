'use strict';

const prompts  = require('prompts');
const chalk = require('chalk');

const cloud = require('./cloudProvider')

async function run(name) {
    let cp = cloud.currentProvider();
    if (!cp) {
        console.error(chalk.red('Need Cloud Provider. (Re)run: '));
        console.error('   spine config');
        console.error('');
        process.exit(1);
    }

    await cp.newapp(name)
}

module.exports = {
    run,
};
