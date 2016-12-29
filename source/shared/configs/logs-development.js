import bsyslog from 'bunyan-syslog';

export default {
  streams: [{
    level: 'info',
    stream: process.stdout,
  }, {
    level: 'warn',
    stream: process.stderr,
  }, {
    level: 'error',
    type: 'raw',
    stream: bsyslog.createBunyanStream({
      type: 'sys',
      facility: bsyslog.local0,
      host: 'logs5.papertrailapp.com',
      port: 47226,
    }),
  }],
};
