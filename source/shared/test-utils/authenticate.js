import tokenUtil from '../utils/token';
import * as userRepo from '../../modules/core/repositories/user';
import * as authenticationService from '../../modules/authentication/services/authentication';

/**
 * @module shared/test-utils/authencticate
 */

/**
 * @typedef {Object} AuthorizedUser
 * @property {UserModel}
 * @property {string} token
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
  const user = await findUserById(decodedToken.sub, null, false);

  return {
    ...user,
    token: accessToken,
    integrations: decodedToken.integrations,
  };
};
