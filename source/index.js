import 'babel-polyfill';
import createServer from 'server';
import analytics from 'common/services/analytics';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'debug') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const server = createServer(process.env.PORT || 8000);

server.start(err => {
  if (err) throw err;

  analytics.init();

  console.log('Server running at:', server.info.uri);
});
