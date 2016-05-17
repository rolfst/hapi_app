export default {
  get: (path, handler, auth = 'default') => {
    return {
      method: 'GET',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth }
    }
  },
  post: (path, handler, auth = 'default') => {
    return {
      method: 'POST',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth }
    }
  },
  patch: (path, handler, auth = 'default') => {
    return {
      method: 'PATCH',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth }
    }
  },
  delete: (path, handler, auth = 'default') => {
    return {
      method: 'DELETE',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth }
    }
  },
};
