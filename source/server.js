'use strict';

import Hapi from 'hapi';
import routes from 'create-routes';
import authenticator from 'common/middlewares/authenticator';

const createServer = port => {
  const options = {};

  const makeConfig = () => {
    if (process.env.NODE_ENV === 'debug') {
      options.debug = {
        request: ['error'],
      };
    }

    return options;
  };

  const server = new Hapi.Server(makeConfig());

  server.connection({
    host: 'localhost',
    port,
    routes: {
      cors: {
        origin: ['*'],
        headers: ['Origin', 'X-API-Token', 'Content-Type', 'Accept'],
      },
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
    if (req.response.isBoom) {
      const { payload, statusCode } = req.response.output;

      return reply(payload).code(statusCode);
    }

    req.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTION');

    return reply.continue();
  });

  routes.map(route => server.route(route));

  return server;
};

export default createServer;
