import createAdapter from 'integrations/create-adapter';
import { findNetworkById } from 'common/repositories/network';

export default (req, reply) => {
  // TODO: add authorization if user can access the network
  // TODO: add check to check if network has integration enabled or not with adapter
  findNetworkById(req.params.id).then(network => {
    const adapter = createAdapter(network.Integrations[0].id);

    return adapter
      .myShifts(network.externalId)
      .then(shifts => reply({ data: shifts }));
  });
};
