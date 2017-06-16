const { map } = require('lodash');
const Promise = require('bluebird');
const R = require('ramda');
const createError = require('../../../../shared/utils/create-error');
const prefetchCaches = require('../../../authorization/utils/prefetch-caches');
const teamRepository = require('../../repositories/team');
const User = require('../../../authorization/utils/user-cache');
const userService = require('../user');

/**
 * @module modules/core/services/team
 */

const logger = require('../../../../shared/services/logger')('CORE/service/team');

/**
 * Get single team
 * @param {object} payload
 * @param {string} payload.teamId
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 */
async function get(payload, message) {
  logger.debug('Get team', { payload, message });

  const team = await teamRepository.findTeamById(payload.teamId);
  if (!team) throw createError('404', 'Team not found');

  return R.merge(R.omit(['createdAt'], team),
    {
      memberCount: team.memberIds.length,
      isMember: message ? // FIXME: Temporarily because of sync script that has no message
        R.contains(message.credentials.id.toString(), team.memberIds) : false,
      isSynced: !!team.externalId,
      createdAt: team.createdAt, // created_at should always be at the bottom of the response item
    });
}

/**
 * List teams
 * @param {object} payload
 * @param {string} payload.teamIds
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Team[]>} {@link module:modules/core~Team Team} -
 */
async function list(payload, message) {
  logger.debug('Listing teams', { payload, message });

  const teams = await teamRepository.findByIds(payload.teamIds);
  const transformTeam = (team) => R.merge(R.omit(['createdAt'], team),
    {
      memberCount: team.memberIds.length,
      isMember: message ? // FIXME: Temporarily because of sync script that has no message
        R.contains(message.credentials.id.toString(), team.memberIds) : false,
      isSynced: !!team.externalId,
      createdAt: team.createdAt, // created_at should always be at the bottom of the response item
    });

  return R.map(transformTeam, teams);
}

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
const create = async (payload, message) => {
  logger.debug('Creating team', { payload, message });

  const attributes = R.pick(['networkId', 'name', 'description', 'isChannel'], payload);
  const team = await teamRepository.create(attributes);

  if (payload.userIds) {
    await teamRepository.setUsersForTeam(team.id, payload.userIds);
    team.memberIds = payload.userIds;
    team.isMember = R.contains(message.credentials.id, payload.userIds);
    team.memberCount = payload.userIds.length;
    await Promise.map(payload.userIds, User.invalidateCache);
  }

  User.filter((key, cachedUser) => {
    if (cachedUser.hasRoleInNetwork(payload.networkId)) {
      cachedUser.invalidateCache();
    }

    return false;
  });

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
const update = async (payload, message) => {
  logger.debug('Updating team', { payload, message });

  const team = await teamRepository.findTeamById(payload.teamId);
  if (!team) throw createError('404');

  const attributes = R.pick(['name', 'externalId', 'description', 'isChannel'], payload);

  await teamRepository.update(team.id, attributes);

  if (payload.userIds) {
    await teamRepository.setUsersForTeam(team.id, payload.userIds);

    await Promise.all(payload.userIds, User.invalidateCache);
  }

  await prefetchCaches.invalidateTeamCache(team.id);

  return (await list({ teamIds: [payload.teamId] }, message))[0];
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
const listMembersForTeams = async (payload, message) => {
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
const deleteTeamsByIds = async (payload) => {
  User.filter((key, cachedUser) => {
    if (payload.teamIds.some(cachedUser.isMemberOfTeam)) {
      cachedUser.invalidateCache();
    }

    return false;
  });

  return Promise.map(payload.teamIds, async (teamId) => {
    const retVal = await teamRepository.deleteById(teamId);

    await prefetchCaches.invalidateTeamCache(teamId);

    return retVal;
  });
};

exports.create = create;
exports.deleteTeamsByIds = deleteTeamsByIds;
exports.get = get;
exports.list = list;
exports.listMembersForTeams = listMembersForTeams;
exports.update = update;
