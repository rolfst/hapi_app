const baseUrl = process.env.DEV_LOG || '/var/logs/development';

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
