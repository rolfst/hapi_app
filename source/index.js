import 'babel-polyfill';
require('dotenv').config();
import 'newrelic';
import Parse from 'parse/node';
import * as Logger from './shared/services/logger';

const logger = Logger.createLogger('SERVER');
const createServer = require('./server').default;

if (process.env.API_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const server = createServer();

server.start(err => {
  if (err) throw err;

  const { PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY, PARSE_SERVER_URL } = process.env;
  Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY);
  Parse.serverURL = PARSE_SERVER_URL;

  logger.info(`Server running at ${server.info.uri}`);
});
