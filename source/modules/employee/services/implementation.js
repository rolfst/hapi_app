import Promise from 'bluebird';
import * as passwordUtil from '../../../shared/utils/password';
import * as userRepo from '../../core/repositories/user';

/**
 * @module modules/employee/services/employee/impl
 */
const appendPasswordToUser = async (user) => {
  const password = passwordUtil.plainRandom();
  const employee = await userRepo.updateUser(user.id, { password });

  // we use the same object here because we need to use the toJSON function later.
  // therefore we cannot make a copy of this object with the spread syntax.
  employee.plainPassword = password;

  return employee;
};

export const generatePasswordsForMembers = async (members) => {
  return Promise.map(members, await appendPasswordToUser);
};
