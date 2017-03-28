const Hapi = require('hapi');
const routes = require('./create-routes');
const jwtStrategy = require('./shared/middlewares/authenticator-strategy');
const integrationStrategy = require('./shared/middlewares/integration-strategy');
const serverUtil = require('./shared/utils/server');
const serverConfig = require('./shared/configs/server');

const createServer = () => {
  const server = new Hapi.Server(serverUtil.makeConfig());
  server.connection(serverConfig);

  // Register plugins
  server.register(require('hapi-async-handler')); // eslint-disable-line global-require

  // Register schemes + strategies
  server.auth.scheme('jwt', jwtStrategy);
  server.auth.strategy('jwt', 'jwt');
  server.auth.scheme('integration', integrationStrategy);
  server.auth.strategy('integration', 'integration');

  // Register server extensions
  server.ext('onRequest', serverUtil.onRequest());
  server.ext('onPreResponse', serverUtil.onPreResponse());

  // Register routes
  routes.map((route) => server.route(route));

  return server;
};

module.exports = createServer;
