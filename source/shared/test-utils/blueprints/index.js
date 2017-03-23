const fs = require('fs');
const path = require('path');

/*
* This is a clever convenience for accessing our service blueprints.
* In your app, you can just do something like:
*
*     var blueprints = require('source/shared/tests-utils/blueprints');
*     blueprints.model
*
* Inspired by the way Express/Connect loads middleware.
*/
fs.readdirSync(__dirname).forEach((filename) => {
  if (filename === 'index.js') return false;

  const modelName = path.basename(filename, '.json') || path.basename(filename, '.js');
  const load = () => require(`./${modelName}`);

  exports.__defineGetter__(modelName.replace(/-/g, '_'), load);
});
