import Boom from 'boom';
import camelCaseKeys from '../../../common/utils/camel-case-keys';
import * as password from 'common/utils/password';
import signupMail from 'common/mails/signup';
import addedToNetworkMail from 'common/mails/added-to-network';
import * as mailer from 'common/services/mailer';
import { createUser, findUserByEmail } from 'common/repositories/user';
import * as networkRepo from 'common/repositories/network';
import { addUserToNetwork } from 'common/repositories/user';
import { addUserToTeams } from 'common/repositories/team';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import userIsDeletedFromNetwork from 'common/utils/user-is-deleted-from-network';
import * as userRepo from '../../../common/repositories/user';
import * as networkUtil from '../../../common/utils/network';

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
    throw Boom.badData('User with the same email already in this network.');
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
