import tokenUtil from '../utils/token';
import { findUserById } from '../../modules/core/repositories/user';

export default async (server, credentials) => {
  const response = await server.inject({
    method: 'POST',
    url: '/v2/authenticate',
    payload: credentials,
  });

  const { access_token: accessToken } = response.result.data;
  const decodedToken = tokenUtil.decode(accessToken);
  const user = await findUserById(decodedToken.sub);

  return {
    ...user,
    token: accessToken,
    integrations: decodedToken.integrations,
  };
};
