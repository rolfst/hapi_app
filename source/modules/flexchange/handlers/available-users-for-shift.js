import * as networkUtil from 'common/utils/network';
import IntegrationNotFound from 'common/errors/integration-not-found';
import { findUserByEmail } from 'common/repositories/user';
import createAdapter from 'common/utils/create-adapter';

export default async (req, reply) => {
  try {
    if (!networkUtil.hasIntegration(req.pre.network)) throw IntegrationNotFound;
    const adapter = createAdapter(req.pre.network, req.auth.artifacts.integrations);

    const externalUsers = await adapter
      .usersAvailableForShift(req.params.shiftId);

    const internalUsers = await Promise.all(externalUsers.map(u => findUserByEmail(u.email)));

    const response = internalUsers
      .filter(u => u)
      .map(u => networkUtil.addUserScope(u, req.pre.network.id))
      .map(u => u.toJSON());

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
