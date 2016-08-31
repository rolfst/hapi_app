'use strict';

import Hapi from 'hapi';
import routes from 'create-routes';
import log from 'common/services/logger';
import jwtStrategy from 'common/middlewares/authenticator-strategy';
import integrationStrategy from 'common/middlewares/integration-strategy';
import * as serverUtil from 'common/utils/server';
import { server as serverConnection } from 'connections';

const createServer = (port) => {
  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection({ ...serverConnection, port });

  // Register plugins
  server.register(require('hapi-async-handler'));
  server.register(serverUtil.registerAuthorizationPlugin());

  // Register schemes + strategies
  server.auth.scheme('jwt', jwtStrategy);
  server.auth.strategy('jwt', 'jwt');
  server.auth.scheme('integration', integrationStrategy);
  server.auth.strategy('integration', 'integration');

  // Register server extensions
  server.ext('onRequest', serverUtil.onRequest);
  server.ext('onPreResponse', serverUtil.onPreResponse);
  server.ext('onPostAuth', (req, reply) => {
    log.init(req);

    reply.continue();
  });

  server.on('request-internal', (request, event, tags) => {
    if (process.env.NODE_ENV === 'testing') return false;
    if (tags.error && tags.handler) log.internalError(event);
  });

  // Register routes
  routes.map(route => server.route(route));

  return server;
};

export default createServer;
