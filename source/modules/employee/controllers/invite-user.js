import Boom from 'boom';
import * as password from 'common/utils/password';
import signupMail from 'common/mails/signup';
import addedToNetworkMail from 'common/mails/added-to-network';
import * as mailer from 'common/services/mailer';
import { createUser, findUserByEmail } from 'common/repositories/user';
import * as networkRepo from 'common/repositories/network';
import { findTeamById, addUserToTeam } from 'common/repositories/team';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';
import userIsDeletedFromNetwork from 'common/utils/user-is-deleted-from-network';

export const inviteNewUser = async (network, { name, email, roleType }) => {
  const plainPassword = password.plainRandom();
  const attributes = {
    firstName: name,
    username: email,
    email,
    password: password.make(plainPassword),
  };

  const user = await createUser(attributes);
  await networkRepo.addUserToNetwork(network, user, roleType);

  mailer.send(signupMail(network, user, plainPassword));

  return user;
};

export const inviteExistingUser = async (network, user, roleType) => {
  if (userIsDeletedFromNetwork(user, network.id)) {
    await networkRepo.activateUserInNetwork(network, user);
  } else {
    await networkRepo.addUserToNetwork(network, user, roleType);
  }

  await networkRepo.setRoleTypeForUser(network, user, roleType);

  mailer.send(addedToNetworkMail(network, user));

  return user;
};

export default async (network, { name, email, teamId, isAdmin }) => {
  const roleType = isAdmin ? 'ADMIN' : 'EMPLOYEE';
  const team = teamId ? await findTeamById(teamId) : null;
  let user = await findUserByEmail(email);

  if (user && userBelongsToNetwork(user, network.id)) {
    throw Boom.badData('User with the same email already in this network.');
  } else if (user && !userBelongsToNetwork(user, network.id)) {
    await inviteExistingUser(network, user, roleType);
  } else {
    user = await inviteNewUser(network, { name, email, roleType });
  }

  if (team) await addUserToTeam(team, user);

  return user.reload();
};
