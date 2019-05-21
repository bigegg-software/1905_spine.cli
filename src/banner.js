'use strict';

const fs = require('fs')
const path = require('path')

const raw = fs.readFileSync(path.join(__dirname, 'banner.raw'))

module.exports = raw.toString()

