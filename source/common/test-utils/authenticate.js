import tokenUtil from 'common/utils/token';
import { findUserByUsername } from 'common/repositories/user';

export default async (server) => {
  const credentials = { username: 'ruben@flex-appeal.nl', password: 'admin' };

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
    console.log('Authentication error: ', err);
  }
};
