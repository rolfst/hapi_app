import Raven from 'raven';

export default () => new Raven.Client(process.env.SENTRY_DSN, {
  release: require('../../../package.json').version,
  environment: process.env.API_ENV,
});
