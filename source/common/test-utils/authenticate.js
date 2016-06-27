import tokenUtil from 'common/utils/token';
import { findUserByUsername } from 'common/repositories/user';

const defaultCredentials = { username: 'ruben@flex-appeal.nl', password: 'admin' };

export default async (server, credentials = defaultCredentials) => {
  try {
    const response = await server.inject({
      method: 'POST',
      url: '/v2/authenticate',
      payload: credentials,
    });

    const { user: userObj, access_token: accessToken } = response.result.data;

    const decodedToken = tokenUtil.decode(accessToken);
    const user = await findUserByUsername(userObj.username);

    return { authUser: user, authToken: accessToken, authIntegrations: decodedToken.integrations };
  } catch (err) {
    console.log('Test util\'s authentication error: ', err);
  }
};
