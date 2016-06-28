import tokenUtil from 'common/utils/token';
import { findUserByUsername } from 'common/repositories/user';

export default async (server, credentials) => {
  try {
    const response = await server.inject({
      method: 'POST',
      url: '/v2/authenticate',
      payload: credentials,
    });

    const { user: userObj, access_token: accessToken } = response.result.data;
    const decodedToken = tokenUtil.decode(accessToken);
    const user = await findUserByUsername(userObj.username);

    return { user, token: accessToken, integrations: decodedToken.integrations };
  } catch (err) {
    console.log('Test util\'s authentication error: ', err);
  }
};
