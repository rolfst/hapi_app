const Raven = require('raven');

const packageVersion = require('../../../package.json').version;

module.exports = () => new Raven.Client(process.env.SENTRY_DSN, {
  release: packageVersion,
  environment: process.env.API_ENV,
});
