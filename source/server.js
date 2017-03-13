import Hapi from 'hapi';
import createSentryClient from './shared/services/sentry';
import routes from './create-routes';
import jwtStrategy from './shared/middlewares/authenticator-strategy';
import integrationStrategy from './shared/middlewares/integration-strategy';
import * as serverUtil from './shared/utils/server';
import serverConfig from './shared/configs/server';

const createServer = () => {
  const sentryClient = createSentryClient();

  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection(serverConfig);

  // Register plugins
  server.register(require('hapi-async-handler'));

  // Register schemes + strategies
  server.auth.scheme('jwt', jwtStrategy);
  server.auth.strategy('jwt', 'jwt');
  server.auth.scheme('integration', integrationStrategy);
  server.auth.strategy('integration', 'integration');

  // Register server extensions
  server.ext('onRequest', serverUtil.onRequest(sentryClient));
  server.ext('onPreResponse', serverUtil.onPreResponse(sentryClient));

  server.ext('onPostAuth', (req, reply) => {
    if (sentryClient && typeof sentryClient.setUserContext === 'function') {
      sentryClient.setUserContext(req.auth.credentials);
    }

    reply.continue();
  });

  // Register routes
  routes.map(route => server.route(route));

  return server;
};

export default createServer;
