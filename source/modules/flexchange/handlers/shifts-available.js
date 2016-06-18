import Boom from 'boom';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  if (!hasIntegration(req.pre.network)) {
    return reply(Boom.forbidden('User does not have an activated integration.'));
  }

  const adapter = createAdapter(req.pre.network, req.auth.artifacts.integrations);

  return adapter
    .usersAvailableForShift(req.pre.network.externalId, req.params.shiftId)
    .then(users => reply({ data: users }));
};
