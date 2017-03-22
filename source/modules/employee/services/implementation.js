const Promise = require('bluebird');
const passwordUtil = require('../../../shared/utils/password');
const userRepo = require('../../core/repositories/user');

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

const generatePasswordsForMembers = async (members) => {
  return Promise.map(members, await appendPasswordToUser);
};

// exports of functions
exports.generatePasswordsForMembers = generatePasswordsForMembers;
