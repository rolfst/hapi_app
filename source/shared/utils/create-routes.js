const R = require('ramda');
const { EPrefetchData } = require('../../modules/authorization/definitions');

const deepMerge = (a, b) => (R.is(Object, a) && R.is(Object, b) ? R.mergeWith(deepMerge, a, b) : b);

const createDefaultConfig = (stategy, prefetch) => {
  const config = { auth: stategy };

  if (stategy === 'jwt' && prefetch) {
    config.app = { prefetch: prefetch === true ? EPrefetchData.NETWORK : prefetch };
  }

  return config;
};

const getImport = (importFn) => (importFn.default ? importFn.default : importFn);

const createRoute = ({
  method, url, handler, validator, payload, auth = true, strategy = 'jwt', prefetch = true, permissions = null,
}) => {
  const route = {
    method,
    path: url,
    handler: getImport(handler),
    config: {
      app: { permissions },
      validate: validator ? getImport(validator) : {},
    },
  };

  if (auth) route.config = deepMerge(route.config, createDefaultConfig(strategy, prefetch));
  if (payload) route.config.payload = payload;

  return route;
};

exports.createRoutes = (routeObjects) => routeObjects.map(createRoute);
exports.createRoute = createRoute;
