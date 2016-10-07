import {
  differenceBy,
  intersectionBy,
  isNil,
  filter,
  reject,
} from 'lodash';
import Promise from 'bluebird';
import * as passwordUtil from '../../../shared/utils/password';
import createAdapter from '../../../shared/utils/create-adapter';
import * as userRepo from '../../core/repositories/user';

const whitelistMembers = (existingMembers, matchingMembers, matchingCriteria) =>
  intersectionBy(existingMembers, matchingMembers, matchingCriteria);
const blacklistMembers = (existingMembers, matchingMembers, matchingCriteria) =>
  differenceBy(existingMembers, matchingMembers, matchingCriteria);
const hasNoPassword = (user) => isNil(user.password);
const selectUsersWithoutPassword = (users) => filter(users, hasNoPassword);
const selectUsersWithPassword = (users) => reject(users, hasNoPassword);

const appendPasswordToUser = async (user) => {
  const password = passwordUtil.plainRandom();
  const employee = await userRepo.updateUser(user.id, { password });

  // we use the same object here because we need to use the toJSON function later.
  // therefore we cannot make a copy of this object with the spread syntax.
  employee.plainPassword = password;

  return employee;
};

export const getMembersfromIntegration = async (network) => {
  const adapter = createAdapter(network, [], { proceedWithoutToken: true });

  return adapter.fetchUsers();
};

/**
 * This method selects all users from the existing memberslist that match with
 * the matching members list.
 * @param {array} existingMembers
 * @param {array} matchingMembers - to select from the existing members
 * @param {string} matchingCriteria optional - field to match by
 * @method getUsersWithoutPassword
 * @returns {array} all matchedMembers without a password
 */
export const getUsersWithoutPassword = (
  existingMembers,
  matchingMembers,
  matchingCriteria = 'username',
  ) => {
  const whitelistedMembers = whitelistMembers(existingMembers, matchingMembers, matchingCriteria);

  return selectUsersWithoutPassword(whitelistedMembers);
};

export const generatePasswordsForMembers = async (members) => {
  return Promise.map(members, await appendPasswordToUser);
};

/**
 * This method selects all users from the existing memberslist that match with
 * the matching members list.
 * @param {array} existingMembers
 * @param {array} matchingMembers - to select from the existing members
 * @param {array} excludedUsers optional - members to exclude from the matching list
 * @param {string} matchingCriteria optional - field to match by
 * @method getUsersWithPassword
 * @returns {array} all matchedMembers with a password
 */
export const getUsersWithPassword = (
  existingMembers,
  matchingMembers,
  excludedUsers = [],
  matchingCriteria = 'username') => {
  const whitelistedMembers = whitelistMembers(existingMembers, matchingMembers, matchingCriteria);
  const availableUsers = blacklistMembers(whitelistedMembers, excludedUsers, matchingCriteria);

  return selectUsersWithPassword(availableUsers);
};
