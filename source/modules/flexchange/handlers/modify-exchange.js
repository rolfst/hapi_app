import Boom from 'boom';
import moment from 'moment';
import { check } from 'hapi-acl-plugin';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';
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
    const actionHook = actions[action];
    if (!actionHook) throw Boom.badData('Unknown action.');

    check(req.auth.credentials, `${action}-exchange`);
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);

    if (moment(exchange.date).diff(moment(), 'days') < 0) throw Boom.badData('Exchange has been expired.');
    if (exchange.approvedBy) throw Boom.badData('Exchange has already been approved.');

    const updatedExchange = await actionHook(req.pre.network, exchange, req);

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    if (err.isBoom) reply(err);

    reply(Boom.forbidden(err));
  }
};
