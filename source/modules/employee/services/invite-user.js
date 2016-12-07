import { map } from 'lodash';
import * as passwordUtil from '../../../shared/utils/password';
import * as mailer from '../../../shared/services/mailer';
import { UserRoles } from '../../../shared/services/permission';
import createError from '../../../shared/utils/create-error';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import signupMail from '../../../shared/mails/signup';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import addedToExtraNetwork from '../../../shared/mails/added-to-extra-network';
import * as userService from '../../core/services/user';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as teamRepo from '../../core/repositories/team';
import * as impl from './implementation';

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

export const inviteExistingUser = async (network, user, roleType) => {
  const userBelongsToNetwork = await userRepo.userBelongsToNetwork(user.id, network.id);
  const userIsDeletedFromNetwork = await userRepo.userIsDeletedFromNetwork(user.id, network.id);

  if (userBelongsToNetwork) {
    throw createError('403', 'User with the same email already in this network.');
  } else if (userIsDeletedFromNetwork) {
    await networkRepo.activateUserInNetwork(network, user);
  } else {
    await networkRepo.addUser({ userId: user.id, networkId: network.id, roleType });
  }

  await networkRepo.setRoleTypeForUser(network, user, roleType);

  mailer.send(addedToNetworkMail(network, user));

  return user;
};

export const inviteUser = async (payload, message) => {
  const { firstName, lastName, email, teamIds, roleType } = camelCaseKeys(payload);
  const { network } = message;

  const role = roleType ? roleType.toUpperCase() : 'EMPLOYEE';
  let user = await userRepo.findUserByEmail(email);

  if (user) {
    await inviteExistingUser(network, user, role);
  } else {
    user = await inviteNewUser(network, { firstName, lastName, email, roleType: role });
  }

  if (teamIds && teamIds.length > 0) await teamRepo.addUserToTeams(teamIds, user.id);

  return userService.getUserWithNetworkScope({ id: user.id, networkId: network.id });
};


export const inviteUsers = async (payload, message) => {
  const { network } = message;
  const identifiedUser = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: network.id }, message);

  const userBelongsToNetwork = await userRepo.userBelongsToNetwork(identifiedUser.id, network.id);

  if (!userBelongsToNetwork || identifiedUser.roleType !== UserRoles.ADMIN) {
    throw createError('403');
  }

  const networkMembers = await networkRepo.findUsersForNetwork(network.id);
  const matchingMembersFromIntegration = await impl.getMembersfromIntegration(network);

  const usersWithoutPasswords = impl.getUsersWithoutPassword(
    networkMembers, matchingMembersFromIntegration);
  const usersToSendMailto = await impl.generatePasswordsForMembers(usersWithoutPasswords);

  const usersWithPassword = impl.getUsersWithPassword(
    networkMembers, matchingMembersFromIntegration, [identifiedUser]);

  map(usersToSendMailto, (user) => mailer.send(addedToNetworkMail(network, user)));
  map(usersWithPassword, (user) => mailer.send(addedToExtraNetwork(network, user)));
};
