const Logger = require('../../../../shared/services/logger');
const createError = require('../../../../shared/utils/create-error');
const userRepo = require('../../repositories/user');
const networkRepo = require('../../repositories/network');
const { TeamUser } = require('../../repositories/dao');
const userService = require('../user');

/**
 * @module modules/core/services/authorization
 */

const logger = Logger.getLogger('CORE/service/authorization');

/**
 * Assert role type for user
 * @param {object} payload - Object containing payload data
 * @param {array} payload.userId - The id for the user to assert
 * @param {string} payload.networkId - The network to check role type for
 * @param {string} payload.roleType - The role type to compare with result
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method assertRoleTypeForUser
 * @throws Error - 403
 * @return {void}
 */
async function assertRoleTypeForUser(payload, message) {
  logger.info('Asserting role type for user', { payload, message });

  const scopedUser = await userService.getUserWithNetworkScope(
    { id: payload.userId, networkId: payload.networkId }, message);

  if (scopedUser.roleType !== payload.roleType) throw createError('403');

  return;
}

/**
 * Check if the user has is connected to the team
 * @param {object} payload - Object containing payload data
 * @param {string} payload.networkId - The id of the network
 * @param {string} payload.userId - The id of the user
 * @method assertThatUserBelongsToTheNetwork
 * @throws Error - 10002
 * @return {void}
 */
async function assertThatUserBelongsToTheNetwork(payload) {
  const belongs = await userRepo.userBelongsToNetwork(payload.userId, payload.networkId);
  const network = await networkRepo.findNetwork({ userId: payload.userId, id: payload.networkId });
  const result = belongs || network;

  if (!result) {
    throw createError('10002');
  }
}

/**
 * Check if the user has is connected to the team
 * @param {object} payload - Object containing payload data
 * @param {string} payload.teamId - The id of the team
 * @param {string} payload.userId - The id of the user
 * @method assertThatUserBelongsToTheTeam
 * @throws Error - 10010
 * @return {void}
 */
const assertThatUserBelongsToTheTeam = async (payload) => {
  const result = await TeamUser.find({ where: {
    teamId: payload.teamId, userId: payload.userId,
  } });

  if (!result) throw createError('10010');
};

// exports of functions
module.exports = {
  assertRoleTypeForUser,
  assertThatUserBelongsToTheNetwork,
  assertThatUserBelongsToTheTeam,
};
