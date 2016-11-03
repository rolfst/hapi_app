const baseUrl = process.env.PROD_LOG || '/var/logs/production';

export default {
  streams: [{
    level: 'debug',
    stream: process.stdout,
  }, {
    level: 'info',
    stream: process.stdout,
  }, {
    level: 'warn',
    path: `${baseUrl}/node-api.warnings.log`,
  }, {
    level: 'error',
    path: `${baseUrl}/node-api.errors.log`,
  }],
};
