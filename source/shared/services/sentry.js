const Raven = require('raven');

module.exports = () => new Raven.Client(process.env.SENTRY_DSN, {
  release: require('../../../package.json').version,
  environment: process.env.API_ENV,
});
