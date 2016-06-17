import _ from 'lodash';

export const roles = { ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' };

export function hasRole(user, requiredRole) {
  return _.includes(user.scope, requiredRole);
}
