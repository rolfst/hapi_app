import 'babel-polyfill';
import moment from 'moment-timezone';
import dotenv from 'dotenv';
moment.tz.setDefault('Europe/Amsterdam');
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

  console.log(`Server running at ${server.info.uri}`);
});
