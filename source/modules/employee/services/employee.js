const R = require('ramda');
const userRepo = require('../../core/repositories/user');
const userService = require('../../core/services/user');
const User = require('../../authorization/utils/user-cache');
const EmployeeDispatcher = require('../dispatcher');

/**
 * @module modules/employee/services/employee
 */


/**
 * Update current user
 * @param {object} payload - Object containing payload data
 * @param {User} payload.firstName - The firstName for the user to find
 * @param {number} payload.networkId - The id of network to apply scope
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method updateEmployee
 * @return {external:Promise.<User[]>} {@link module:modules/core~User} Promise containing
 * collection of users
 */
const updateEmployee = async (payload, message) => {
  // TODO move this functionality to the core module
  let whitelist = [
    'firstName',
    'lastName',
    'email',
    'password',
    'address',
    'zipCode',
    'dateOfBirth',
    'phoneNum',
    'playerId',
  ];

  // TODO - this function only works for the current user, make it so it can also work for admins

  if (payload.playerId) {
    const user = await userRepo.findUser(message.credentials.id);

    if (user.playerId) {
      whitelist = R.without(['playerId'], whitelist);
    }
  }

  const attributes = R.pick(whitelist, payload);
  await userRepo.updateUser(message.credentials.id, attributes);

  const updatedUser = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);

  EmployeeDispatcher.emit('user.updated', {
    user: updatedUser,
    network: message.network,
    credentials: message.credentials,
  });

  await User.invalidateCache(message.credentials.id);

  return updatedUser;
};

/**
 * Gets current user
 * @param {object} payload - Object containing payload data
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getEmployee
 * @return {external:Promise.<User>} {@link module:modules/core~User} Promise containing
 * collection of users
 */
const getEmployee = async (payload, message) => {
  return userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);
};

async function getOwn(payload, message) {
  return userService.getScoped({ id: message.credentials.id }, message);
}

exports.getEmployee = getEmployee;
exports.getOwn = getOwn;
exports.updateEmployee = updateEmployee;
