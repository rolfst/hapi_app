import Hapi from 'hapi';
import raven from 'raven';
import routes from './create-routes';
import jwtStrategy from './shared/middlewares/authenticator-strategy';
import integrationStrategy from './shared/middlewares/integration-strategy';
import * as serverUtil from './shared/utils/server';
import { server as serverConnection } from './connections';

const createServer = () => {
  const ravenClient = new raven.Client(process.env.SENTRY_DSN, {
    release: require('../package.json').version,
    environment: process.env.NODE_ENV,
  });

  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection(serverConnection);

  // Register plugins
  server.register(require('hapi-async-handler'));

  // Register schemes + strategies
  server.auth.scheme('jwt', jwtStrategy);
  server.auth.strategy('jwt', 'jwt');
  server.auth.scheme('integration', integrationStrategy);
  server.auth.strategy('integration', 'integration');

  // Register server extensions
  server.ext('onRequest', serverUtil.onRequest(ravenClient));
  server.ext('onPreResponse', serverUtil.onPreResponse(ravenClient));

  server.ext('onPostAuth', (req, reply) => {
    if (ravenClient && typeof ravenClient.setUserContext === 'function') {
      ravenClient.setUserContext(req.auth.credentials);
    }

    reply.continue();
  });

  // Register routes
  routes.map(route => server.route(route));

  return server;
};

export default createServer;
