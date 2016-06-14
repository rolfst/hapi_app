import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';

export default (req, reply) => {
  // TODO: add authorization if user can access the network
  // TODO: add check to check if network has integration enabled or not with adapter
  findNetworkById(req.params.networkId).then(network => {
    const adapter = createAdapter(network, req.auth.artifacts.integrations);

    return adapter
      .myShifts(network.externalId)
      .then(shifts => reply({ data: shifts }));
  });
};
