import tokenUtil from '../utils/token';
import * as authenticationService from '../../modules/authentication/services/authentication';

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
 * @param {Message} {@link module:/shared~Message}
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
