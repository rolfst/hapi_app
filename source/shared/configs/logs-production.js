export default {
  streams: [{
    level: 'debug',
    stream: process.stdout,
  }, {
    level: 'info',
    stream: process.stdout,
  }, {
    level: 'warn',
    path: process.stderr,
  }, {
    level: 'error',
    path: process.stderr,
  }],
};
