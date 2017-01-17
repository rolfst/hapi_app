import { map } from 'lodash';
import Promise from 'bluebird';
import R from 'ramda';
import createError from '../../../../shared/utils/create-error';
import * as Logger from '../../../../shared/services/logger';
import * as authorizationService from '../../services/authorization';
import * as teamRepository from '../../repositories/team';
import * as userService from '../user';

/**
 * @module modules/core/services/team
 */

const logger = Logger.getLogger('CORE/service/team');

/**
 * @description Create a new team
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - Id of the parent network
 * @param {string} payload.name - Name of the team
 * @param {string} payload.description - Description for the team
 * @param {boolean} [payload.isChannel] - If the team should be shown on timeline
 * @param {array} [payload.userIds] - User who should be in the team
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Team>} {@link module:modules/core~Team Team}
 */
export const create = async (payload, message) => {
  logger.info('Creating team', { payload, message });

  await authorizationService.assertRoleTypeForUser({
    userId: message.credentials.id,
    networkId: payload.networkId,
    roleType: 'ADMIN',
  }, message);

  const attributes = R.pick(['networkId', 'name', 'description', 'isChannel'], payload);
  const team = await teamRepository.create(attributes);

  if (payload.userIds) {
    await teamRepository.setUsersForTeam(team.id, payload.userIds);
    team.memberIds = payload.userIds;
  }

  return team;
};

/**
 * @description Updates an existing team
 * @param {object} payload - Object containing payload data
 * @param {string} payload.teamId - Id of the team
 * @param {string} [payload.name] - Name of the team
 * @param {string} [payload.description] - Description for the team
 * @param {string} [payload.externalId] - The external id for a team
 * @param {boolean} [payload.isChannel] - If the team is an channel
 * @param {array} [payload.userIds] - User who should be in the team
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method create
 * @return {external:Promise.<Team>} {@link module:modules/core~Team Team}
 */
export const update = async (payload, message) => {
  logger.info('Updating team', { payload, message });

  await authorizationService.assertRoleTypeForUser({
    userId: message.credentials.id,
    networkId: payload.networkId,
    roleType: 'ADMIN',
  }, message);

  const team = await teamRepository.findTeamById(payload.teamId);
  if (!team) throw createError('404');

  const attributes = R.pick(['name', 'externalId', 'description', 'isChannel'], payload);
  await teamRepository.update(team.id, attributes);

  if (payload.userIds) {
    await teamRepository.setUsersForTeam(team.id, payload.userIds);
  }

  return R.merge(team, payload.userIds ?
    { ...attributes, memberIds: payload.userIds } : attributes);
};

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
  const users = await teamRepository.findUsersByTeamIds(payload.teamIds);

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
  const teams = await teamRepository.findTeamsByIds(teamIds);

  return Promise.map(teams, async (team) => {
    await team.destroy();

    return team.id;
  });
};
