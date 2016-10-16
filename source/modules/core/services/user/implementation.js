import { first, map } from 'lodash';
import * as teamRepo from '../../repositories/team';

export const createFunctionName = async (userId, network) => {
  const teamsThatUserBelongsTo = await teamRepo
    .findTeamsForNetworkThatUserBelongsTo(userId, network.id);

  if (teamsThatUserBelongsTo.length === 0) return network.name;

  return first(map(teamsThatUserBelongsTo, 'name'));
};
