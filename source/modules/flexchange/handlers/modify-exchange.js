import Boom from 'boom';
import hasIntegration from 'common/utils/network-has-integration';
import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';
import {
  findExchangeById,
  acceptExchange,
  declineExchange,
  approveExchange,
  rejectExchange,
} from 'modules/flexchange/repositories/exchange';
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
      if (err.isBoom) return reply(err);

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
      return acceptExchange(exchange, req.auth.credentials);
    })
    .then(acceptedExchange => {
      // TODO: Fire ExchangeWasAccepted event
      return acceptedExchange;
    });
};

const declineExchangeAction = (network, req) => {
  if (hasIntegration(network)) {
    return createAdapter(network).declineExchange;
  }

  return findExchangeById(req.params.exchangeId)
    .then(exchange => {
      // TODO: Check if logged user may decline the exchange
      return declineExchange(exchange, req.auth.credentials);
    })
    .then(declinedExchange => {
      // TODO: Fire ExchangeWasDeclined event
      return declinedExchange;
    });
};

const approveExchangeAction = (network, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  // 1. Find exchange
  const userIdToApprove = req.payload.user_id;

  return findExchangeById(req.params.exchangeId)
    .then(exchange => {
      // TODO: Check if logged user may approve the exchange
      const exchangeResponse = findExchangeResponseByExchangeAndUser(exchange, userIdToApprove);
      return [exchangeResponse, exchange];
    })
    .spread((exchangeResponse, exchange) => {
      if (exchangeResponse.approved) {
        throw Boom.badData('The user is already approved.');
      }

      if (!exchangeResponse.response) {
        throw Boom.badData('The user didn\'t accept the exchange.');
      }

      return approveExchange(exchange, req.auth.credentials, userIdToApprove);
    })
    .then(exchange => {
      // TODO: Fire ExchangeWasApproved event
      return exchange;
    });
};

const rejectExchangeAction = (network, req) => {
  if (!req.payload.user_id) throw Boom.badData('Missing user_id to approve.');
  // 1. Find exchange
  const userIdToApprove = req.payload.user_id;

  return findExchangeById(req.params.exchangeId)
    .then(exchange => {
      // TODO: Check if logged user may reject the exchange
      const exchangeResponse = findExchangeResponseByExchangeAndUser(exchange, userIdToApprove);
      return [exchangeResponse, exchange];
    })
    .spread((exchangeResponse, exchange) => {
      if (exchangeResponse.approved) {
        throw Boom.badData('The user is already approved.');
      }

      if (exchangeResponse.approved === 0) {
        throw Boom.badData('The user is already rejected.');
      }

      if (!exchangeResponse.response) {
        throw Boom.badData('The user didn\'t accept the exchange.');
      }

      return rejectExchange(exchange, req.auth.credentials, userIdToApprove);
    })
    .then(exchange => {
      // TODO: Fire ExchangeWasRejected event
      return exchange;
    });
};
