import 'babel-polyfill';
import 'newrelic';
import Parse from 'parse/node';
import dotenv from 'dotenv';
dotenv.config();
const createServer = require('./server').default;

if (process.env.NODE_ENV === 'debug') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const server = createServer(process.env.PORT || 8000);

server.start(err => {
  if (err) throw err;

  const { PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY } = process.env;
  Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY);

  console.log(`Server running at ${server.info.uri}`);
});
