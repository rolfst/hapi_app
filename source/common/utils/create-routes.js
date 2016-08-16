import preFetchNetwork from 'common/middlewares/prefetch-network';

const defaultConfig = {
  auth: 'jwt',
  pre: [{ method: preFetchNetwork, assign: 'network' }],
};

const getImport = (importFn) => importFn.default ? importFn.default : importFn;

export const createRoute = ({ method, url, handler, validator, auth = true }) => {
  const route = {
    method,
    path: url,
    handler: getImport(handler),
    config: {
      validate: validator ? getImport(validator) : {},
    },
  };

  if (auth) route.config = { ...route.config, ...defaultConfig };

  return route;
};

export default (routeObjects) => routeObjects.map(createRoute);
