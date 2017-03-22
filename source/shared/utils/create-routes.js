const R = require('ramda');

const preFetchNetwork = require('../middlewares/prefetch-network');

const createDefaultConfig = (stategy, prefetch) => {
  const config = { auth: stategy };

  if (stategy === 'jwt' && prefetch) {
    config.pre = [{ method: preFetchNetwork, assign: 'network' }];
  }

  return config;
};

const getImport = (importFn) => importFn.default ? importFn.default : importFn;

const createRoute = ({
  method, url, handler, validator, payload, auth = true, strategy = 'jwt', prefetch = true,
}) => {
  const route = {
    method,
    path: url,
    handler: getImport(handler),
    config: {
      validate: validator ? getImport(validator) : {},
    },
  };

  if (auth) route.config = R.merge(route.config, createDefaultConfig(strategy, prefetch));
  if (payload) route.config.payload = payload;

  return route;
};

exports.createRoutes = (routeObjects) => routeObjects.map(createRoute);
exports.createRoute = createRoute;
