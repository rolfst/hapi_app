import { roles } from 'common/services/permission';
import preFetchNetwork from 'common/middlewares/prefetch-network';

export const defaultScope = [roles.EMPLOYEE, roles.ADMIN];
export const adminScope = [roles.ADMIN];

function makeRoute(method, path, handler, scope = defaultScope, strategy = 'jwt') {
  const route = {
    method,
    path,
    handler: handler.default ? handler.default : handler,
    config: {
      auth: {
        strategy,
        access: { scope },
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
