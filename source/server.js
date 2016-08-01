'use strict';

import Hapi from 'hapi';
import routes from 'create-routes';
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

  // Register routes
  routes.map(route => server.route(route));

  return server;
};

export default createServer;
