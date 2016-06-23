import preFetchNetwork from 'common/middlewares/prefetch-network';

function makeRoute(method, path, handler, strategy = 'jwt') {
  const route = {
    method,
    path,
    handler: handler.default ? handler.default : handler,
    config: {
      auth: {
        strategy,
      },
      pre: [{ method: preFetchNetwork, assign: 'network' }],
    },
  };

  return route;
}

export default {
  get: (path, handler) => {
    return makeRoute('GET', path, handler);
  },
  post: (path, handler) => {
    return makeRoute('POST', path, handler);
  },
  put: (path, handler) => {
    return makeRoute('PUT', path, handler);
  },
  patch: (path, handler) => {
    return makeRoute('PATCH', path, handler);
  },
  delete: (path, handler) => {
    return makeRoute('DELETE', path, handler);
  },
};
