import Boom from 'boom';
import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default async (req, reply) => {
  try {
    if (!hasIntegration(req.pre.network)) {
      return reply(Boom.forbidden('User does not have an activated integration.'));
    }

    const adapter = createAdapter(req.pre.network, req.auth.artifacts.integrations);

    const shifts = await adapter.myShifts(req.pre.network.externalId);

    return reply({ data: shifts });
  } catch (err) {
    console.log('Error retrieving shifts', err);
    return reply(err);
  }
};
