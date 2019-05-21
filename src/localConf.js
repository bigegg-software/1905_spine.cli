'use strict';
const Configstore = require('configstore');

const defaults = {};

const CONF_NAME = 'spine-cli';
const conf = new Configstore(CONF_NAME, defaults, {
    globalConfigPath: true
});


module.exports = conf;
