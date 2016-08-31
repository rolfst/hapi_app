import 'babel-polyfill';
import dotenv from 'dotenv';
import log from 'common/services/logger';
dotenv.config();

const createServer = require('server').default;
const analytics = require('common/services/analytics').default;

if (process.env.NODE_ENV === 'debug') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const server = createServer(process.env.PORT || 8000);

server.start(err => {
  if (err) throw err;

  analytics.init();

  log.info(`Server running at ${server.info.uri}`);
});
