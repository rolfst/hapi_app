import preFetchNetwork from 'common/middlewares/prefetch-network';

const defaultConfig = {
  auth: 'jwt',
  pre: [{ method: preFetchNetwork, assign: 'network' }],
};

const getImport = (importFn) => importFn.default ? importFn.default : importFn;

export const createRoute = (routeObject) => ({
  method: routeObject.method,
  path: routeObject.url,
  handler: getImport(routeObject.handler),
  config: {
    ...defaultConfig,
    validate: routeObject.validator ? getImport(routeObject.validator) : {},
  },
});

export default (routeObjects) => routeObjects.map(createRoute);
