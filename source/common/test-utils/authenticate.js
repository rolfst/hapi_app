import tokenUtil from 'common/utils/token';
import { findUserById } from 'common/repositories/user';

export default async (server, credentials) => {
  try {
    const response = await server.inject({
      method: 'POST',
      url: '/v2/authenticate',
      payload: credentials,
    });

    const { access_token: accessToken } = response.result.data;
    const decodedToken = tokenUtil.decode(accessToken);
    const user = await findUserById(decodedToken.sub);

    return { user, token: accessToken, integrations: decodedToken.integrations };
  } catch (err) {
    console.log('Test util\'s authentication error: ', err);
  }
};
