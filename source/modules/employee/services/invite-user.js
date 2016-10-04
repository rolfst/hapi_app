import { map, differenceBy, sortBy } from 'lodash';
import createError from '../../../shared/utils/create-error';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import * as password from '../../../shared/utils/password';
import signupMail from '../../../shared/mails/signup';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import * as mailer from '../../../shared/services/mailer';
import { createUser, findUserByEmail } from '../../core/repositories/user';
import * as networkRepo from '../../core/repositories/network';
import { addUserToNetwork } from '../../core/repositories/user';
import { addUserToTeams } from '../../core/repositories/team';
import userBelongsToNetwork from '../../../shared/utils/user-belongs-to-network';
import userIsDeletedFromNetwork from '../../../shared/utils/user-is-deleted-from-network';
import * as userRepo from '../../core/repositories/user';
import * as networkUtil from '../../../shared/utils/network';
import { isAdmin } from '../../../shared/services/permission';

export const inviteNewUser = async (network, { firstName, lastName, email, roleType }) => {
  const plainPassword = password.plainRandom();
  const attributes = {
    firstName,
    lastName,
    username: email,
    email,
    password: password.make(plainPassword),
  };

  const user = await createUser(attributes);
  await addUserToNetwork(user, network, { roleType });

  mailer.send(signupMail(network, user, plainPassword));

  return user;
};

export const inviteExistingUser = async (network, user, roleType) => {
  if (userIsDeletedFromNetwork(user, network.id)) {
    await networkRepo.activateUserInNetwork(network, user);
  } else {
    await addUserToNetwork(user, network, { roleType });
  }

  await networkRepo.setRoleTypeForUser(network, user, roleType);

  mailer.send(addedToNetworkMail(network, user));

  return user;
};

export const inviteUser = async (payload, message) => {
  const { firstName, lastName, email, teamIds, roleType } = camelCaseKeys(payload);
  const { network } = message;

  const role = roleType ? roleType.toUpperCase() : 'EMPLOYEE';
  let user = await findUserByEmail(email);

  if (user && userBelongsToNetwork(user, network.id)) {
    throw createError('403', 'User with the same email already in this network.');
  } else if (user && !userBelongsToNetwork(user, network.id)) {
    await inviteExistingUser(network, user, role);
  } else {
    user = await inviteNewUser(network, { firstName, lastName, email, roleType: role });
  }

  if (teamIds && teamIds.length > 0) await addUserToTeams(teamIds, user.id);
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
  const users = sortBy(differenceBy(networkMembers, [currentUser], 'email'), 'username');

  map(users, (user) => mailer.send(addedToNetworkMail(network, user)));

  return users;
};
