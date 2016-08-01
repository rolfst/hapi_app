import Boom from 'boom';
import moment from 'moment';
import { check } from 'hapi-acl-plugin';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import acceptExchange from 'modules/flexchange/handlers/accept-exchange';
import declineExchange from 'modules/flexchange/handlers/decline-exchange';
import approveExchange from 'modules/flexchange/handlers/approve-exchange';
import rejectExchange from 'modules/flexchange/handlers/reject-exchange';

const isExpired = (date) => moment(date).diff(moment(), 'days') < 0;

export default async (req, reply) => {
  const actions = {
    accept: acceptExchange,
    decline: declineExchange,
    approve: approveExchange,
    reject: rejectExchange,
  };

  try {
    const actionHook = actions[req.payload.action];

    check(req.auth.credentials, `${req.payload.action}-exchange`);
    const exchange = await findExchangeById(req.params.exchangeId, req.auth.credentials.id);

    if (isExpired(exchange.date)) throw Boom.forbidden('Exchange has been expired.');
    if (exchange.approvedBy) throw Boom.badData('Exchange has already been approved.');

    const updatedExchange = await actionHook(req.pre.network, exchange, req);

    return reply({ success: true, data: updatedExchange.toJSON() });
  } catch (err) {
    if (err.isBoom) reply(err);

    reply(Boom.forbidden(err));
  }
};
