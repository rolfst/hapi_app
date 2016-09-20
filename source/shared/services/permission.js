export const UserRoles = { ADMIN: 'ADMIN', EMPLOYEE: 'EMPLOYEE' };

export function hasRole(user, requiredRole) {
  return user.role === requiredRole;
}

export const isAdmin = (user) => user.role === UserRoles.ADMIN;
export const isEmployee = (user) => user.role === UserRoles.EMPLOYEE;
