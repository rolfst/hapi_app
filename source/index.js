'use strict';

import dotenv from 'dotenv';
import createServer from 'server';

const server = createServer(8000);

server.start(err => {
  if (err) throw err;

  dotenv.config();

  console.log('Server running at:', server.info.uri);
});
