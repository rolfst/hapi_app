import * as networkUtils from '../../../shared/utils/network';
import * as userRepo from '../../core/repositories/user';

export const updateEmployee = async (payload, message) => {
  const updatedUser = await userRepo.updateUser(message.credentials.id, payload.attributes);

  return networkUtils.addUserScope(updatedUser, message.network.id);
};

export const getEmployee = async (payload, message) => {
  const user = await userRepo.findUserById(message.credentials.id);

  return networkUtils.addUserScope(user, message.network.id);
};
