const Hapi = require('hapi');
const createSentryClient = require('./shared/services/sentry');
const routes = require('./create-routes');
const jwtStrategy = require('./shared/middlewares/authenticator-strategy');
const integrationStrategy = require('./shared/middlewares/integration-strategy');
const serverUtil = require('./shared/utils/server');
const serverConfig = require('./shared/configs/server');

const createServer = () => {
  const sentryClient = createSentryClient();

  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection(serverConfig);

  // Register plugins
  server.register(require('hapi-async-handler')); // eslint-disable-line global-require
  server.register({
    register: require('good'), // eslint-disable-line global-require
    options: {
      ops: false,
      reporters: {
        dogReporter: [{
          module: 'good-datadog',
          args: [{
            debug: process.env.LOGLEVEL === 'DEBUG',
            host: process.env.API_ENV === 'development' ? 'test.api.flex-appeal.nl' : 'localhost',
            globalTags: [`env:${process.env.API_ENV}`],
          }],
        }],
      },
    },
  });

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
  routes.map((route) => server.route(route));

  return server;
};

module.exports = createServer;
