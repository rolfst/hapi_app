import { map } from 'lodash';
import * as teamRepo from '../../../../shared/repositories/team';
import * as userService from '../user';

/**
 * Retrieve members of multiple teams.
 * @param {object} payload - Object containing payload data
 * @param {array} payload.teamIds - The ids for the teams to find
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.network - The network associated with the request
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listUsers
 * @return {Promise} Promise containing collection of users
 */
export const listMembersForTeams = async (payload, message) => {
  const users = await teamRepo.findUsersByTeamIds(payload.teamIds);

  return userService.listUsers({ userIds: map(users, 'id') }, message);
};
