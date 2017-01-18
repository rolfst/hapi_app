import { first, map } from 'lodash';
import * as teamRepo from '../../repositories/team';

export const createFunctionName = async (userId, network) => {
  const teamsThatUserBelongsTo = await teamRepo
    .findTeamsForNetworkThatUserBelongsTo(userId, network.id);

  if (teamsThatUserBelongsTo.length === 0) return network.name;

  return first(map(teamsThatUserBelongsTo, 'name'));
};

export async function createScopedUser(user, metaData) {
  return {
    ...user,
    roleType: metaData.roleType,
    externalId: metaData.externalId,
    deletedAt: metaData.deletedAt,
    invitedAt: metaData.invitedAt,
    integrationAuth: !!metaData.userToken,
  };
}
