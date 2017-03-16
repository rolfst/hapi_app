module.exports = {
  streams: [{
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
