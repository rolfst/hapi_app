import _ from 'lodash';

export const role = { ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' };

export function hasRole(user, requiredRole) {
  return _.includes(user.scope, requiredRole);
}
