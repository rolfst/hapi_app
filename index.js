'use strict';

import Hapi from 'hapi';
import { createRoutes } from './src/routes';

const server = new Hapi.Server();
server.connection({
  host: 'localhost',
  port: 8000,
});

createRoutes(server);

server.start(err => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
