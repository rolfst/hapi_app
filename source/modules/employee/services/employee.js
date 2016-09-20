import * as userRepo from '../../../shared/repositories/user';

export const updateEmployee = async (payload, message) => {
  const updatedUser = await userRepo.updateUser(message.credentials.id, payload.attributes);

  return updatedUser;
};

export const getEmployee = async (payload, message) => {
  const user = userRepo.findUserById(message.credentials.id);
  return user;
};
