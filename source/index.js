/* eslint no-console: "off" */
'use strict';

import dotenv from 'dotenv';
import createServer from 'server';

dotenv.config();

const { PORT } = process.env;
const server = createServer(PORT || 8000);

server.start(err => {
  if (err) throw err;

  console.log('Server running at:', server.info.uri);
});
