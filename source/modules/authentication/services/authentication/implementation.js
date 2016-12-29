import moment from 'moment';
import bcrypt from 'bcrypt';
import createError from '../../../../shared/utils/create-error';
import * as authenticationRepo from '../../../core/repositories/authentication';
import * as userRepo from '../../../core/repositories/user';
import * as networkRepo from '../../../core/repositories/network';
import createAccessToken from '../../utils/create-access-token';
import createRefreshToken from '../../utils/create-refresh-token';

export const assertUserBelongsToANetwork = async (userId) => {
  const networksContainingUser = await networkRepo.findNetworksForUser(userId);

  if (networksContainingUser.length === 0) {
    throw createError('403', 'The user does not belong to any network.');
  }

  return true;
};

export const checkPassword = (hash, plain) => {
  // We have to replace the first characters because of the
  // difference between the PHP bcrypt hasher and JavaScript's
  return bcrypt.compareSync(plain, hash.replace('$2y$', '$2a$'));
};

export const updateLastLogin = async (user) => {
  userRepo.updateUser(user.id, { lastLogin: moment().toISOString() });
};

export const authenticateUser = async ({ username, password }) => {
  const user = await userRepo.findCredentialsForUser(username);

  if (!user) throw createError('10004');

  const validPassword = checkPassword(user.password, password);

  if (!validPassword) throw createError('10004');

  return user;
};

export const createAuthenticationTokens = async (userId, deviceName) => {
  const device = await authenticationRepo.findOrCreateUserDevice(userId, deviceName);
  const accessToken = createAccessToken(userId, device.device_id);
  const refreshToken = await createRefreshToken(userId, device.device_id);

  return { accessToken, refreshToken };
};

export const getAuthenticationTokens = async (user, deviceName) => {
  const { accessToken, refreshToken } = await createAuthenticationTokens(
    user.id, deviceName);

  updateLastLogin(user);

  return { accessToken, refreshToken };
};
