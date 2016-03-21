'use strict';

import Hapi from 'hapi';
import routes from 'routes/create-routes';
import authenticator from 'middlewares/authenticator';

const server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 8000,
  routes: {
    cors: true,
  },
});

server.auth.scheme('jwt', authenticator);
server.auth.strategy('default', 'jwt');
server.auth.default('default');

server.ext('onRequest', (req, reply) => {
  process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;
  return reply.continue();
});

server.ext('onPreResponse', (req, reply) => {
  req.response.header('Access-Control-Allow-Origin', '*');
  req.response.header('Access-Control-Allow-Headers', 'x-api-token');
  reply.continue();
});

routes.map(route => server.route(route));

server.start(err => {
  if (err) throw err;

  console.log('Server running at:', server.info.uri);
});
