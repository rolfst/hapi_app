import { map, intersectionBy, reject } from 'lodash';
import Promise from 'bluebird';
import * as passwordUtil from '../../../shared/utils/password';
import * as mailer from '../../../shared/services/mailer';
import { UserRoles } from '../../../shared/services/permission';
import createError from '../../../shared/utils/create-error';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import signupMail from '../../../shared/mails/signup';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import * as userService from '../../core/services/user';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as teamRepo from '../../core/repositories/team';
import EmployeeDispatcher from '../dispatcher';
import * as impl from './implementation';

/**
 * @module modules/employee/services/inviteUser
 */

/**
 * Invites a new user to a network
 * @param {Network} network - network to invite into
 * @param {object} payload - The user properties for the new user
 * @param {string} payload.firstName - The first name of the user
 * @param {string} payload.lastName - The last name of the user
 * @param {string} payload.email - The email of the user
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @method inviteNewUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * the invited user
 */
export const inviteNewUser = async (network, { firstName, lastName, email, roleType }) => {
  const plainPassword = passwordUtil.plainRandom();
  const attributes = {
    firstName,
    lastName,
    username: email,
    email,
    password: plainPassword,
  };

  const user = await userRepo.createUser(attributes);
  await networkRepo.addUser({ userId: user.id, networkId: network.id, roleType });

  mailer.send(signupMail(network, user, plainPassword));

  return user;
};

/**
 * Invites an existing user to a network
 * @param {Network} network - network to invite into
 * @param {User} user - The {@link module:modules/core~user User} to update
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @method inviteExistingUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * the invited user
 */
export const inviteExistingUser = async (network, user, roleType) => {
  const userBelongsToNetwork = await userRepo.userBelongsToNetwork(user.id, network.id);
  const networkId = network.id;
  const userId = user.id;

  if (userBelongsToNetwork) {
    throw createError('403', 'User with the same email already in this network.');
  } else {
    await networkRepo.addUser({ userId, networkId, roleType });
  }

  await userRepo.setNetworkLink({ networkId, userId, roleType, deletedAt: null });

  mailer.send(addedToNetworkMail(network, user));

  return user;
};

/**
 * Invites a user to a network
 * @param {Network} network - network to invite into
 * @param {object} payload - The user properties for the new user
 * @param {string} payload.firstName - The first name of the user
 * @param {string} payload.lastName - The last name of the user
 * @param {string} payload.email - The email of the user
 * @param {string} payload.roleType - The {@link module:shared~UserRoles roletype} of the
 * user in the integration
 * @param {string[]} payload.teamIds - The teams the user will belong to
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method inviteUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing the
 * invited user
 */
export const inviteUser = async (payload, message) => {
  const { firstName, lastName, email, teamIds, roleType } = camelCaseKeys(payload);
  const { network } = message;

  const role = roleType ? roleType.toUpperCase() : 'EMPLOYEE';
  let user = await userRepo.findUserBy({ email });

  if (user) {
    await inviteExistingUser(network, user, role);
  } else {
    user = await inviteNewUser(network, { firstName, lastName, email, roleType: role });
  }

  if (teamIds && teamIds.length > 0) await teamRepo.addUserToTeams(teamIds, user.id);

  const createdUser = await userService.getUserWithNetworkScope({
    id: user.id, networkId: network.id });

  EmployeeDispatcher.emit('user.created', {
    user: createdUser,
    network: message.network,
    credentials: message.credentials,
  });

  return createdUser;
};


/**
 * Invites users to a network
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method inviteUser
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing the
 * invited user
 */
export const inviteUsers = async (payload, message) => {
  const { network } = message;
  const identifiedUser = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: network.id }, message);
  const userBelongsToNetwork = await userRepo.userBelongsToNetwork(identifiedUser.id, network.id);

  if (!userBelongsToNetwork || identifiedUser.roleType !== UserRoles.ADMIN) {
    throw createError('403');
  }

  const networkMembers = await userService.listUsersWithNetworkScope({
    userIds: payload.userIds, networkId: network.id }, message);
  const preparedUsers = reject(networkMembers, 'invitedAt');
  const toNotifyUsers = intersectionBy(preparedUsers, networkMembers, 'id');
  const usersToSendMailto = await impl.generatePasswordsForMembers(toNotifyUsers);

  await Promise.map(usersToSendMailto, user =>
    userRepo.setNetworkLink({ userId: user.id, networkId: network.id, invitedAt: new Date() }));

  map(usersToSendMailto, (user) => mailer.send(signupMail(network, user, user.plainPassword)));
};
