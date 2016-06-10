import UserDevice from 'common/models/user-device';
import createDeviceId from 'common/utils/create-device-id';

export function findUserDevice(userId, deviceName) {
  return UserDevice.findOne({ where: { userId, deviceName } });
}

export function createUserDevice(deviceId, deviceName, userId) {
  return UserDevice.create({ deviceId, deviceName, userId });
}

export function findOrCreateUserDevice(userId, deviceName) {
  return findUserDevice(userId, deviceName).then(device => {
    if (!device) {
      return createUserDevice(createDeviceId(), deviceName, userId)
        .then(createdDevice => createdDevice);
    }

    return device;
  });
}
