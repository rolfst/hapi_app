import addNetworkScope from 'common/utils/add-network-scope';
import IntegrationNotFound from 'common/errors/integration-not-found';
import { findUserByEmail } from 'common/repositories/user';
import createAdapter from 'common/utils/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default async (req, reply) => {
  try {
    if (!hasIntegration(req.pre.network)) throw IntegrationNotFound;
    const adapter = createAdapter(req.pre.network, req.auth.artifacts.integrations);

    const externalUsers = await adapter
      .usersAvailableForShift(req.params.shiftId);

    const internalUsers = await Promise.all(externalUsers.map(u => findUserByEmail(u.email)));

    const response = internalUsers
      .filter(u => u)
      .map(u => addNetworkScope(u, req.pre.network.id))
      .map(u => u.toJSON());

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
