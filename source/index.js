import 'babel-polyfill';
import dotenv from 'dotenv';
dotenv.config();

const createServer = require('./server').default;
const analytics = require('./shared/services/analytics').default;

if (process.env.NODE_ENV === 'debug') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const server = createServer(process.env.PORT || 8000);

server.start(err => {
  if (err) throw err;

  analytics.init();

  console.log(`Server running at ${server.info.uri}`);
});
