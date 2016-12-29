import { map } from 'lodash';
import Promise from 'bluebird';
import * as teamRepo from '../../repositories/team';
import * as userService from '../user';

/**
 * @module modules/core/services/team
 */

/**
 * @description Retrieve members of multiple teams
 * @param {object} payload - Object containing payload data
 * @param {array} payload.teamIds - The ids for the teams to find
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMembersForTeams
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User} - Promise
 * containing collection of users
 */
export const listMembersForTeams = async (payload, message) => {
  const users = await teamRepo.findUsersByTeamIds(payload.teamIds);

  return userService.listUsersWithNetworkScope({
    userIds: map(users, 'id'),
    networkId: message.network.id,
  }, message);
};

/**
 * Delete teams
 * @param {object} payload - Object containing payload data
 * @param {array} payload.teamIds - The ids for the teams to be deleted
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method deleteTeamsByIds
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 * Promise containing collection of deleted teams
 */
export const deleteTeamsByIds = async (payload) => {
  const { teamIds } = payload;
  const teams = await teamRepo.findTeamsByIds(teamIds);

  return Promise.map(teams, async (team) => {
    await team.destroy();

    return team.id;
  });
};
