const tokenUtil = require('../utils/token');
const userRepo = require('../../modules/core/repositories/user');
const authenticationService = require('../../modules/authentication/services/authentication');

/**
 * @module shared/test-utils/authencticate
 */

/**
 * @typedef {Object} AuthorizedUser
 * @property {User} {@link module:modules/core~User user}
 * @property {AuthenticationToken} {@link module:shared~AuthenticationToken token}
 * @property {Object[]} integrations
 */

/**
 * @param {object} credentials
 * @param {string} credentials.username
 * @param {string} credentials.password
 * @method default
 * @returns {@link module:shared/test-utils/authenticate.AuthorizedUser}
 */
export default async (credentials, message) => {
  const { accessToken } = await authenticationService.authenticate(credentials, message);
  const decodedToken = tokenUtil.decode(accessToken);
  const user = await userRepo.findUserById(decodedToken.sub, null, false);

  return {
    ...user,
    token: accessToken,
    integrations: decodedToken.integrations,
  };
};
