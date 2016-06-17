import Boom from 'boom';
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
    const hook = actions[req.payload.action];
    const exchange = await hook(req.pre.network, req);

    return reply({ success: true, data: exchange.toJSON() });
  } catch (err) {
    if (err.isBoom) return reply(err);

    return reply(Boom.badData('Unknown action.'));
  }
};
