import { findNetworkById } from 'common/repositories/network';
import createAdapter from 'adapters/create-adapter';

export default (req, reply) => {
  // TODO: add authorization if user can access the network
  // TODO: add check to check if network has integration enabled or not
  // TODO: add approve and reject hook
  findNetworkById(req.params.networkId).then(network => {
    const adapter = createAdapter(network.Integrations[0].id);

    const actions = {
      accept: adapter.acceptExchange,
      decline: adapter.declineExchange,
    };

    const hook = actions[req.payload.action];

    return hook(network.externalId, req.params.shiftId)
      .then(success => {
        if (!success) throw Error(`Could not ${req.payload.action} the shift.`);

        reply({ success: true });
      });
  });
};
