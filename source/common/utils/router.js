function makeRoute(method, path, handler, auth) {
  const route = {
    method,
    path,
    handler: handler.default ? handler.default : handler,
  };

  if (auth !== null) route.config = { auth };

  return route;
}

export default {
  get: (path, handler, auth = 'jwt') => {
    return makeRoute('GET', path, handler, auth);
  },
  post: (path, handler, auth = 'jwt') => {
    return makeRoute('POST', path, handler, auth);
  },
  put: (path, handler, auth = 'jwt') => {
    return makeRoute('PUT', path, handler, auth);
  },
  patch: (path, handler, auth = 'jwt') => {
    return makeRoute('PATCH', path, handler, auth);
  },
  delete: (path, handler, auth = 'jwt') => {
    return makeRoute('DELETE', path, handler, auth);
  },
};
