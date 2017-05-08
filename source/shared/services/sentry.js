const Raven = require('raven');

const packageVersion = require('../../../package.json').version;

module.exports = () => {
  let client = Raven.config(process.env.SENTRY_DSN, {
    release: packageVersion,
    environment: process.env.API_ENV,
  });

  // In production we want a global error handler from the raven client
  if (process.env.API_ENV === 'production' && !process.env.FORCE_SENTRY_LOG) {
    client = client.install();
  }

  return client;
};
