import Hapi from 'hapi';
import { omit } from 'lodash';
import raven from 'raven';
import routes from './create-routes';
import jwtStrategy from './shared/middlewares/authenticator-strategy';
import integrationStrategy from './shared/middlewares/integration-strategy';
import * as serverUtil from './shared/utils/server';
import { server as serverConnection } from './connections';

const createServer = (port) => {
  const ravenClient = new raven.Client(process.env.SENTRY_DSN, {
    release: require('../package.json').version,
    environment: process.env.NODE_ENV,
  });

  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection({ ...serverConnection, port });

  // Register plugins
  server.register(require('hapi-async-handler'));

  // Register schemes + strategies
  server.auth.scheme('jwt', jwtStrategy);
  server.auth.strategy('jwt', 'jwt');
  server.auth.scheme('integration', integrationStrategy);
  server.auth.strategy('integration', 'integration');

  // Register server extensions
  server.ext('onRequest', serverUtil.onRequest);
  server.ext('onPreResponse', serverUtil.onPreResponse);

  server.ext('onPostAuth', (req, reply) => {
    const requestContext = {
      id: req.id,
      payload: omit(req.payload, 'password'),
      user_agent: req.headers['user-agent'],
      method: req.method,
      url: req.path,
      headers: req.headers,
    };

    ravenClient.setExtraContext({ request: requestContext });
    ravenClient.setUserContext(req.auth.credentials);

    reply.continue();
  });

  server.on('request-internal', (request, event, tags) => {
    if (process.env.NODE_ENV === 'production') return false;

    if (tags.error && tags.internal) {
      if (process.env.NODE_ENV === 'debug') {
        console.error(request.getLog());
        return false;
      }

      ravenClient.captureException(event.data);
    }
  });

  // Register routes
  routes.map(route => server.route(route));

  return server;
};

export default createServer;
