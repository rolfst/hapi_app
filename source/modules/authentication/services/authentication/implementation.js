const moment = require('moment');
const bcrypt = require('bcrypt');
const createError = require('../../../../shared/utils/create-error');
const authenticationRepo = require('../../../core/repositories/authentication');
const userRepo = require('../../../core/repositories/user');
const createAccessToken = require('../../utils/create-access-token');
const createRefreshToken = require('../../utils/create-refresh-token');

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
