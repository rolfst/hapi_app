const createError = require('../../../../shared/utils/create-error');
const tokenUtil = require('../../../../shared/utils/token');
const userRepo = require('../../../core/repositories/user');
const organisationRepo = require('../../../core/repositories/organisation');
const Mixpanel = require('../../../../shared/services/mixpanel');
const firstLoginEvent = require('../../analytics/first-login-event');
const impl = require('./implementation');

/**
 * @module modules/authentication/services/authentication
 */

/**
 * Delegates for interaction with an integration partner
 * @param {object} payload
 * @param {string} payload.refreshToken
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method authenticate
 * @return {external:Promise.<accessToken>}
 * {@link module:/modules/authentication~AuthenticatedUser AuthenticatedUser}
 *
 */
const delegate = async (payload, message) => {
  let decodedToken;

  try {
    decodedToken = tokenUtil.decode(payload.refreshToken);
  } catch (err) {
    throw createError('403', 'Wrong refresh token specified.');
  }

  if (!decodedToken.sub) throw createError('403', 'No sub found in refresh token.');

  const user = await userRepo.findUserById(decodedToken.sub, null, false);
  const { accessToken } = await impl.createAuthenticationTokens(user.id, message.deviceName);

  userRepo.updateNetworkLink({ user_id: user.id }, { lastActive: new Date() });
  organisationRepo.updateOrganisationLink({ userId: user.id }, { lastActive: new Date() });

  return { accessToken };
};

/**
 * Authencticates a user
 * @param {object} payload
 * @param {string} payload.username
 * @param {string} payload.password
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method authenticate
 * @return {external:Promise.<AuthenticatedUser>}
 * {@link module:/modules/authentication~AuthenticatedUser AuthenticatedUser}
 */
const authenticate = async (payload, message) => {
  const user = await impl.authenticateUser(payload);
  const tokens = await impl.getAuthenticationTokens(user, message.deviceName);

  Mixpanel.registerProfile(user);

  if (user.lastLogin === null) Mixpanel.track(firstLoginEvent(), user.id);

  userRepo.updateNetworkLink({ user_id: user.id }, { lastActive: new Date() });
  organisationRepo.updateOrganisationLink({ userId: user.id }, { lastActive: new Date() });

  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
};

exports.delegate = delegate;
exports.authenticate = authenticate;
