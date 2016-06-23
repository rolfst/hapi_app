import Boom from 'boom';
import _ from 'lodash';
import tokenUtil from 'common/utils/token';
import { findUserById } from 'common/repositories/user';

export const getRoleType = (user, networkId) => {
  const network = _.find(user.Networks, { id: parseInt(networkId, 10) });
  return network.NetworkUser.roleType;
};

export const authenticate = async (networkId, token = null) => {
  if (!token) throw new Error('No token specified.');

  const { sub: userId, integrations } = tokenUtil.decode(token);
  const user = await findUserById(userId);

  if (networkId) {
    user.scope = getRoleType(user, networkId);
  }

  return {
    credentials: user,
    artifacts: { integrations },
  };
};

export default () => {
  return {
    authenticate: async (request, reply) => {
      const { networkId } = request.params;
      const token = request.raw.req.headers['x-api-token'];

      try {
        const result = await authenticate(networkId, token);

        return reply.continue(result);
      } catch (err) {
        console.log('Error in Authenticator Strategy: ', err);
        return reply(Boom.unauthorized(err.message));
      }
    },
  };
};
