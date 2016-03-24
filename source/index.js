'use strict';

import Hapi from 'hapi';
import dotenv from 'dotenv';
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

// Accept CORS requests
server.ext('onPreResponse', (req, reply) => {
  const allowedHeaders = 'Origin, X-API-Token, Content-Type, Accept';

  if (req.response.isBoom) {
    const { payload, statusCode } = req.response.output;

    return reply(payload)
			.code(statusCode)
			.header('Access-Control-Allow-Origin', '*')
			.header('Access-Control-Allow-Headers', allowedHeaders);
  }

  req.response.header('Access-Control-Allow-Origin', '*');
  req.response.header('Access-Control-Allow-Headers', allowedHeaders);

  return reply.continue();
});

routes.map(route => server.route(route));

server.start(err => {
  if (err) throw err;

  dotenv.config();

  console.log('Server running at:', server.info.uri);
});
