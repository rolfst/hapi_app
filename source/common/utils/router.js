import { role } from 'common/services/permission';

export const defaultScope = [role.EMPLOYEE, role.ADMIN];
export const defaultStrategy = 'default';

export const adminScope = [role.ADMIN];

export default {
  get: (path, handler, scope = defaultScope, strategy = defaultStrategy) => {
    return {
      method: 'GET',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth: {
        strategy,
        access: {
          scope,
        },
      } },
    };
  },
  post: (path, handler, scope = defaultScope, strategy = defaultStrategy) => {
    return {
      method: 'POST',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth: {
        strategy,
        access: {
          scope,
        },
      } },
    };
  },
  put: (path, handler, scope = defaultScope, strategy = defaultStrategy) => {
    return {
      method: 'PUT',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth: {
        strategy,
        access: {
          scope,
        },
      } },
    };
  },
  patch: (path, handler, scope = defaultScope, strategy = defaultStrategy) => {
    return {
      method: 'PATCH',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth: {
        strategy,
        access: {
          scope,
        },
      } },
    };
  },
  delete: (path, handler, scope = defaultScope, strategy = defaultStrategy) => {
    return {
      method: 'DELETE',
      path,
      handler: handler.default ? handler.default : handler,
      config: { auth: {
        strategy,
        access: {
          scope,
        },
      } },
    };
  },
};
