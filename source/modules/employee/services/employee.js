import * as userRepo from '../../core/repositories/user';
import * as userService from '../../core/services/user';
import { dispatchEvent, EventTypes } from '../../../shared/services/dispatch-event';

export const updateEmployee = async (payload, message) => {
  const updatedUser = await userRepo.updateUser(message.credentials.id, payload.attributes);

  dispatchEvent(EventTypes.USER_UPDATED, message.credentials, { user: updatedUser });

  return userService.getUserWithNetworkScope({
    id: updatedUser.id, networkId: message.network.id }, message);
};

export const getEmployee = async (payload, message) => {
  return userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);
};
