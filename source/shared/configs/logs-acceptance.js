export default {
  streams: [{
    level: 'debug',
    stream: process.stdout,
  }, {
    level: 'info',
    stream: process.stdout,
  }, {
    level: 'warn',
    stream: process.stderr,
  }, {
    level: 'error',
    stream: process.stderr,
  }],
};
