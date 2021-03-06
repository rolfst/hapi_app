const uuid = require('uuid-v4');
const { UserDevice } = require('./dao');

/**
 * @module modules/core/repositories/authentication
 */

/**
 * @param {string} userId
 * @param {string} deviceName
 * @method findUserDevice
 * @return {external:Promise.<UserDevice>} {@link module:shared~Activity Activity}
 */
function findUserDevice(userId, deviceName) {
  return UserDevice.findOne({ where: { userId, deviceName } });
}

/**
 * @param {string} deviceId
 * @param {string} deviceName
 * @param {string} userId
 * @method createUserDevice
 * @return {external:Promise.<Device>} {@link module:shared~Device Device}
 */
function createUserDevice(deviceId, deviceName, userId) {
  return UserDevice.create({ deviceId, deviceName, userId });
}

/**
 * @param {string} userId
 * @param {string} deviceName
 * @method findOrCreateUserDevice
 * @return {external:Promise.<Device>} {@link module:shared~Device Device}
 */
function findOrCreateUserDevice(userId, deviceName) {
  return findUserDevice(userId, deviceName).then((device) => {
    if (!device) {
      const deviceId = uuid().toUpperCase().replace(/-/g, '');

      return createUserDevice(deviceId, deviceName, userId);
    }

    return device;
  });
}

exports.createUserDevice = createUserDevice;
exports.findOrCreateUserDevice = findOrCreateUserDevice;
exports.findUserDevice = findUserDevice;
