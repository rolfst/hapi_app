import Boom from 'boom';
import { hasRole, roles } from 'common/services/permission';
import acceptExchange from 'modules/flexchange/handlers/accept-exchange';
import declineExchange from 'modules/flexchange/handlers/decline-exchange';
import approveExchange from 'modules/flexchange/handlers/approve-exchange';
import rejectExchange from 'modules/flexchange/handlers/reject-exchange';

export default async (req, reply) => {
  const actions = {
    accept: acceptExchange,
    decline: declineExchange,
    approve: approveExchange,
    reject: rejectExchange,
  };

  try {
    const { action } = req.payload;

    if ((action === 'approve' || action === 'reject') &&
      !hasRole(req.auth.credentials, roles.ADMIN)) {
      return reply(Boom.forbidden('Insufficient scope'));
    }

    const hook = actions[action];
    const exchange = await hook(req.pre.network, req);

    return reply({ success: true, data: exchange.toJSON() });
  } catch (err) {
    if (err.isBoom) return reply(err);

    return reply(Boom.badData('Unknown action.'));
  }
};
