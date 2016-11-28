import { map } from 'lodash';
import Promise from 'bluebird';
import * as teamRepo from '../../repositories/team';
import * as userService from '../user';

/**
 * Retrieve members of multiple teams.
 * @param {object} payload - Object containing payload data
 * @param {array} payload.teamIds - The ids for the teams to find
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.network - The network associated with the request
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listMembersForTeams
 * @return {Promise} Promise containing collection of users
 */
export const listMembersForTeams = async (payload, message) => {
  const users = await teamRepo.findUsersByTeamIds(payload.teamIds);

  return userService.listUsersWithNetworkScope({
    userIds: map(users, 'id'),
    networkId: message.network.id,
  }, message);
};

/**
 * Retrieve teams.
 * @param {object} payload - Object containing payload data
 * @param {array} payload.teamIds - The ids for the teams to find
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.network - The network associated with the request
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listTeams
 * @return {Promise} Promise containing collection of teams
 */
export const listTeams = async (payload) => {
  return teamRepo.findTeamsByIds(payload.teamIds);
};

/**
 * Delete teams.
 * @param {object} payload - Object containing payload data
 * @param {array} payload.teamIds - The ids for the teams to be deleted
 * @method deleteTeamsByIds
 * @return {Promise} Promise containing collection of deleted teams
 */
export const deleteTeamsByIds = async (payload) => {
  const { teamIds } = payload;
  const teams = await teamRepo.findTeamsByIds(teamIds);

  return Promise.map(teams, async (team) => {
    await team.destroy();

    return team.id;
  });
};
