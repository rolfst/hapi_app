/* eslint-disable global-require, import/no-dynamic-require */
const fs = require('fs');
const path = require('path');

/*
* This is a clever convenience for accessing our service blueprints.
* In your app, you can just do something like:
*
*     var stubs = require('source/shared/tests-utils/stubs');
*     stubs.model
*
* Inspired by the way Express/Connect loads middleware.
*/
fs.readdirSync(__dirname).forEach((filename) => {
  if (filename === 'index.js') return false;

  const modelName = path.basename(filename, '.json');

  exports[modelName.replace(/-/g, '_')] = require(`./${modelName}`);
});
