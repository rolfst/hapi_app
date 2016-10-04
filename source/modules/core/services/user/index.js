import * as networkUtils from '../../../../shared/utils/network';
import * as userRepo from '../../repositories/user';

/**
 * Retrieve multiple users by id.
 * @param {object} payload - Object containing payload data
 * @param {array} payload.userIds - The ids for the user to find
 * @param {object} message - Object containing meta data
 * @param {object} message.credentials - The authenticated user
 * @param {object} message.network - The network associated with the request
 * @param {object} message.artifacts - Artifacts containing request meta data
 * @method listUsers
 * @return {Promise} Promise containing collection of users
 */
export const listUsers = async (payload, message) => {
  const users = await userRepo.findUsersByIds(payload.userIds);

  return users.map(user => networkUtils.addUserScope(user, message.network.id));
};
