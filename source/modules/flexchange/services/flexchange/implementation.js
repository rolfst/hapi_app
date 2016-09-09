import { filter } from 'lodash';
import createAdapter from '../../../../common/utils/create-adapter';
import * as networkUtil from '../../../../common/utils/network';
import * as userRepo from '../../../../common/repositories/user';

export const findAvailableUsersForShift = async (shiftId, network, artifacts) => {
  const adapter = createAdapter(network, artifacts.integrations);
  const externalUsers = await adapter.usersAvailableForShift(shiftId);

  return externalUsers;
};

export const matchUsersForShift = async (usersToMatch, network) => {
  const matchedUsers = await Promise.all(
    usersToMatch.map(u => userRepo.findUserByEmail(u.email)));

  const response = filter(matchedUsers, (u) => u)
    .map((u) => networkUtil.addUserScope(u, network.id));

  return response;
};
