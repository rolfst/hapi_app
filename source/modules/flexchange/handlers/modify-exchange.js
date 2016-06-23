import Boom from 'boom';
import { check } from 'hapi-acl-plugin';
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

  const { action } = req.payload;

  try {
    const hook = actions[action];
    if (!hook) throw Boom.badData('Unknown action.');

    check(req.auth.credentials, `${action}-exchange`);

    const exchange = await hook(req.pre.network, req);

    return reply({ success: true, data: exchange.toJSON() });
  } catch (err) {
    if (err.isBoom) reply(err);

    reply(Boom.forbidden(err));
  }
};
