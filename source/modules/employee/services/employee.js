import * as userRepo from '../../core/repositories/user';
import * as userService from '../../core/services/user';

export const updateEmployee = async (payload, message) => {
  const updatedUser = await userRepo.updateUser(message.credentials.id, payload.attributes);

  return userService.getUserWithNetworkScope({
    id: updatedUser.id, networkId: message.network.id }, message);
};

export const getEmployee = async (payload, message) => {
  return userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);
};
