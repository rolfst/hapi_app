import * as userRepo from '../../core/repositories/user';
import * as userService from '../../core/services/user';

/**
 * @module modules/employee/services/employee
 */


/**
 * Update current user
 * @param {object} payload - Object containing payload data
 * @param {User} payload.attributes - The id for the user to find
 * @param {number} payload.networkId - The id of network to apply scope
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getUserWithNetworkScope
 * @return {external:Promise.<User[]>} {@link module:modules/core~User} Promise containing
 * collection of users
 */
export const updateEmployee = async (payload, message) => {
  // TODO move this functionality to the core module
  const updatedUser = await userRepo.updateUser(message.credentials.id, payload.attributes);

  return userService.getUserWithNetworkScope({
    id: updatedUser.id, networkId: message.network.id }, message);
};

/**
 * Gets current user
 * @param {object} payload - Object containing payload data
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getEmployee
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * collection of users
 */
export const getEmployee = async (payload, message) => {
  return userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);
};
