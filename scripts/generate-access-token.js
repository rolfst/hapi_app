#!/usr/bin/env node
require('dotenv').config();
const createAccessToken = require('../source/modules/authorization/utils/create-access-token');
const args = require('yargs').argv;

if (!args.userId) {
  console.log('Missing userId flag');
  process.exit(1);
}

console.log(createAccessToken.default(args.userId, null));
