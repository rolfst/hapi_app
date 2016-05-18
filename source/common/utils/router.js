export default {
  get: (path, handler) => {
    return {
      method: 'GET',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth: 'default' },
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
  put: (path, handler, auth = 'default') => {
    return {
      method: 'PUT',
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
