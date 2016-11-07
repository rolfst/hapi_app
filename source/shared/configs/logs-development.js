const baseUrl = process.env.LOG_DIR || '/var/log/node.test.api.flex-appeal.nl';

export default {
  streams: [{
    level: 'debug',
    stream: process.stdout,
  }, {
    level: 'info',
    stream: process.stdout,
  }, {
    level: 'warn',
    path: `${baseUrl}/warnings.log`,
  }, {
    level: 'error',
    path: `${baseUrl}/errors.log`,
  }],
};
