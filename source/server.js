'use strict';

import Hapi from 'hapi';
import Boom from 'boom';
import _ from 'lodash';
import authorizationPlugin from 'hapi-acl-plugin';
import createActions from 'common/utils/create-actions';
import createError from 'common/utils/create-error';
import respondWithError from 'common/utils/respond-with-error';
import routes from 'create-routes';
import jwtStrategy from 'common/middlewares/authenticator-strategy';
import integrationStrategy from 'common/middlewares/integration-strategy';

if (process.env.NODE_ENV === 'debug') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

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

  server.register(require('hapi-async-handler'));

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

  server.register({
    register: authorizationPlugin, options: {
      actions: createActions(),
      role: (user, params) => {
        if (params.networkId) {
          const network = _.find(user.Networks, { id: parseInt(params.networkId, 10) });

          return network.NetworkUser.roleType;
        }
      },
    },
  });

  server.auth.scheme('jwt', jwtStrategy);
  server.auth.strategy('jwt', 'jwt');
  server.auth.scheme('integration', integrationStrategy);
  server.auth.strategy('integration', 'integration');

  server.ext('onRequest', (req, reply) => {
    if (process.env.NODE_ENV !== 'testing') {
      console.log('Received request with path', req.path);
    }

    process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;

    return reply.continue();
  });

  // Accept CORS requests
  server.ext('onPreResponse', (req, reply) => {
    if (req.response.data && req.response.data.isJoi) {
      const error = createError(Boom.badData(req.response.message), 'validation_error');
      const response = respondWithError(error);

      return reply(response).code(response.error.status_code);
    }

    if (req.response.isBoom) {
      const response = respondWithError(req.response);
      return reply(response).code(response.error.status_code);
    }

    req.response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTION');

    return reply.continue();
  });

  routes.map(route => server.route(route));

  return server;
};

export default createServer;
