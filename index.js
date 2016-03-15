'use strict';

import Hapi from 'hapi';
import routes from 'routes/create-routes';

const server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 3000,
});

server.ext('onRequest', (req, reply) => {
  process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;
  return reply.continue();
});

routes.map(route => server.route(route));

server.start(err => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
