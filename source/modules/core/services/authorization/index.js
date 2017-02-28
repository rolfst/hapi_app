import * as Logger from '../../../../shared/services/logger';
import createError from '../../../../shared/utils/create-error';
import * as userRepo from '../../repositories/user';
import * as networkRepo from '../../repositories/network';
import * as userService from '../user';

/**
 * @module modules/core/services/network
 */

const logger = Logger.getLogger('CORE/service/network');

/**
 * Assert role type for user
 * @param {object} payload - Object containing payload data
 * @param {array} payload.userId - The id for the user to assert
 * @param {string} payload.networkId - The network to check role type for
 * @param {string} payload.roleType - The role type to compare with result
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method assertRoleTypeForUser
 * @return {void}
 */
export async function assertRoleTypeForUser(payload, message) {
  logger.info('Asserting role type for user', { payload, message });

  const scopedUser = await userService.getUserWithNetworkScope(
    { id: payload.userId, networkId: payload.networkId }, message);

  if (scopedUser.roleType !== payload.roleType) throw createError('403');

  return;
}

export async function assertThatUserBelongsToTheNetwork(payload) {
  const belongs = await userRepo.userBelongsToNetwork(payload.userId, payload.networkId);
  const network = await networkRepo.findNetwork({ userId: payload.userId, id: payload.networkId });
  const result = belongs || network;

  if (!result) {
    throw createError('10002');
  }
}
