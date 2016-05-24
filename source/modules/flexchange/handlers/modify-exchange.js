import Boom from 'boom';
import { findNetworkById } from 'common/repositories/network';
import acceptExchange from 'modules/flexchange/handlers/accept-exchange';
import declineExchange from 'modules/flexchange/handlers/decline-exchange';
import approveExchange from 'modules/flexchange/handlers/approve-exchange';
import rejectExchange from 'modules/flexchange/handlers/reject-exchange';

export default (req, reply) => {
  // TODO: add authorization if user can access the network
  findNetworkById(req.params.networkId).then(network => {
    const actions = {
      accept: acceptExchange,
      decline: declineExchange,
      approve: approveExchange,
      reject: rejectExchange,
    };

    try {
      const hook = actions[req.payload.action];

      return hook(network, req)
        .then(exchange => reply({ success: true, data: exchange.toJSON() }))
        .catch(err => reply(err));
    } catch (err) {
      if (err.isBoom) return reply(err);

      return reply(Boom.forbidden('Unknown action.'));
    }
  });
};
