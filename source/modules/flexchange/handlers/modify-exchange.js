import Boom from 'boom';
import hasIntegration from 'common/utils/network-has-integration';
import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';
import { findExchangeById, acceptExchange } from 'modules/flexchange/repositories/exchange';
import {
  findExchangeResponseByExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

export default (req, reply) => {
  // TODO: add authorization if user can access the network
  findNetworkById(req.params.networkId).then(network => {
    const actions = {
      accept: acceptExchangeAction, // eslint-disable-line no-use-before-define
      decline: declineExchangeAction, // eslint-disable-line no-use-before-define
      approve: approveExchangeAction, // eslint-disable-line no-use-before-define
      reject: rejectExchangeAction, // eslint-disable-line no-use-before-define
    };

    try {
      const hook = actions[req.payload.action];

      return hook(network, req)
        .then(exchange => reply({ success: true, data: { exchange } }))
        .catch(err => reply(err));
    } catch (err) {
      return reply(Boom.forbidden('Unknown action.'));
    }
  });
};

const acceptExchangeAction = (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network).acceptExchange;
  }

  return findExchangeById(req.params.exchangeId)
    .then(exchange => {
      // TODO: Check if logged user may accept the exchange
      return [exchange, findExchangeResponseByExchangeAndUser(exchange, req.auth.credentials)];
    })
    .spread((exchange, exchangeResponse) => {
      // TODO: If exchange is decline, remove declined response and create new accepted response
      if (exchangeResponse) throw Boom.forbidden('User already responded to this exchange.');

      // TODO: Fire ExchangeWasAccepted event
      return acceptExchange(exchange, req.auth.credentials);
    });
};

const declineExchangeAction = network => {
  if (hasIntegration(network)) {
    return createAdapter(network).declineExchange;
  }

  // 1. Find exchange
  // 2. Check if logged user may decline the exchange
  // 3. Decline exchange from repository
  // 3.1. If exchange is accepted, remove accepted response and create new declined response
  // 4. Fire ExchangeWasDeclined event
  // 5. Return declined exchange
};

const approveExchangeAction = (network, user) => {
  // 1. Find exchange
  // 2. Check if logged user may approve the exchange
  // 3. Check if exchange can be approved else throw Error
  // 3.1. Check if user accepted the exchange
  // 3.2. Check if user response is declined
  // 3.3. Check if exchange is not already approved
  // 4. Approve exchange from repository
  // 5. Update approved_by attribute in the exchange from 1. with the current logged user id
  // 6. Fire ExchangeWasApproved event
  // 7. Return approved exchange
}

const rejectExchangeAction = (network, user) => {
  // 1. Find exchange
  // 2. Check if logged user may approve the exchange
  // 3. Check if exchange can be reject else throw Error
  // 3.1. Check if user accepted the exchange
  // 3.2. Check if user response is declined
  // 3.3. Check if exchange is not already rejected
  // 4. Reject exchange from repository
  // 5. Fire ExchangeWasRejected event
  // 6. Return rejected exchange
}
