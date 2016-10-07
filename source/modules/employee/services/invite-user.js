import {
  map,
  concat,
  sortBy,
} from 'lodash';
import * as networkUtil from '../../../shared/utils/network';
import * as passwordUtil from '../../../shared/utils/password';
import * as mailer from '../../../shared/services/mailer';
import { isAdmin } from '../../../shared/services/permission';
import createError from '../../../shared/utils/create-error';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import signupMail from '../../../shared/mails/signup';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import addedToExtraNetwork from '../../../shared/mails/added-to-extra-network';
import userBelongsToNetwork from '../../../shared/utils/user-belongs-to-network';
import userIsDeletedFromNetwork from '../../../shared/utils/user-is-deleted-from-network';
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
    password: passwordUtil.make(plainPassword),
  };

  const user = await userRepo.createUser(attributes);
  await userRepo.addUserToNetwork(user, network, { roleType });

  mailer.send(signupMail(network, user, plainPassword));

  return user;
};

export const inviteExistingUser = async (network, user, roleType) => {
  if (userIsDeletedFromNetwork(user, network.id)) {
    await networkRepo.activateUserInNetwork(network, user);
  } else {
    await userRepo.addUserToNetwork(user, network, { roleType });
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

  if (user && userBelongsToNetwork(user, network.id)) {
    throw createError('403', 'User with the same email already in this network.');
  } else if (user && !userBelongsToNetwork(user, network.id)) {
    await inviteExistingUser(network, user, role);
  } else {
    user = await inviteNewUser(network, { firstName, lastName, email, roleType: role });
  }

  if (teamIds && teamIds.length > 0) await teamRepo.addUserToTeams(teamIds, user.id);
  user.reload();

  const invitedUser = await userRepo.findUserByEmail(email);

  return networkUtil.addUserScope(invitedUser, network.id);
};


export const inviteUsers = async (payload, message) => {
  const { network } = message;
  const currentUser = await userRepo.findUserById(message.credentials.id);
  const identifiedUser = networkUtil.addUserScope(currentUser, network.id);
  if (!userBelongsToNetwork(identifiedUser, network.id)
    || !isAdmin(identifiedUser)) throw createError('403');

  const networkMembers = await networkRepo.findActiveUsersForNetwork(network);
  const matchingMembersFromIntegration = await impl.getMembersfromIntegration(network);

  const usersWithoutPasswords = impl.getUsersWithoutPassword(
    networkMembers, matchingMembersFromIntegration);
  const usersToSendMailto = await impl.generatePasswordsForMembers(usersWithoutPasswords);

  const usersWithPassword = impl.getUsersWithPassword(
    networkMembers, matchingMembersFromIntegration, [identifiedUser]);

  map(usersToSendMailto, (user) => mailer.send(addedToNetworkMail(network, user)));
  map(usersWithPassword, (user) => mailer.send(addedToExtraNetwork(network, user)));

  return sortBy(concat(usersToSendMailto, usersWithPassword), 'username');
};
