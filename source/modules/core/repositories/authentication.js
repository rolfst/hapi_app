import { UserDevice } from '../../../shared/models';
import createDeviceId from '../../../shared/utils/create-device-id';

/**
 * @module modules/core/repositories/authentication
 */

/**
 * @param {string} userId
 * @param {string} deviceName
 * @method findUserDevice
 * @return {external:Promise.<UserDevice>} {@link module:shared~Activity Activity}
 */
export function findUserDevice(userId, deviceName) {
  return UserDevice.findOne({ where: { userId, deviceName } });
}

/**
 * @param {string} deviceId
 * @param {string} deviceName
 * @param {string} userId
 * @method createUserDevice
 * @return {external:Promise.<Device>} {@link module:shared~Device Device}
 */
export function createUserDevice(deviceId, deviceName, userId) {
  return UserDevice.create({ deviceId, deviceName, userId });
}

/**
 * @param {string} userId
 * @param {string} deviceName
 * @method findOrCreateUserDevice
 * @return {external:Promise.<Device>} {@link module:shared~Device Device}
 */
export function findOrCreateUserDevice(userId, deviceName) {
  return findUserDevice(userId, deviceName).then(device => {
    if (!device) {
      return createUserDevice(createDeviceId(), deviceName, userId)
        .then(createdDevice => createdDevice);
    }

    return device;
  });
}
