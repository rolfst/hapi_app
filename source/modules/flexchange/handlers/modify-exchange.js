import Boom from 'boom';
import { hasRole, role } from 'common/services/permission';
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
      const { action } = req.payload;

      if ((action === 'approve' || action === 'reject') &&
        !hasRole(req.auth.credentials, role.ADMIN)) {
        return reply(Boom.forbidden('Insufficient scope'));
      }

      const hook = actions[action];

      return hook(network, req)
        .then(exchange => reply({ success: true, data: exchange.toJSON() }))
        .catch(err => reply(err));
    } catch (err) {
      if (err.isBoom) return reply(err);

      return reply(Boom.badData(err));
    }
  });
};
