import Boom from 'boom';
import { Exchange, ExchangeResponse } from 'modules/flexchange/models';
import { User } from 'common/models';
import { createExchangeResponse } from 'modules/flexchange/repositories/exchange-response';
import {
  findExchangeResponseByExchangeAndUser,
  removeExchangeResponseForExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

/**
 * Find a specific exchange by id
 * @param {number} exchangeId - Id of exchange being looked for
 * @method findExchangeById
 * @return {promise} Find exchange promise
 */
export function findExchangeById(exchangeId) {
  return Exchange
    .findById(exchangeId, {
      include: [
        { model: User, as: 'ApprovedUser' },
        { model: ExchangeResponse },
      ],
    })
    .then(exchange => {
      if (!exchange) return Boom.notFound(`No exchange found with id ${exchangeId}.`);

      return exchange;
    });
}

/**
 * Find exchanges by user
 * @param {User} user - User we want the exchanges from
 * @method findExchangesByUser
 * @return {promise} Get exchanges promise
 */
export function findExchangesByUser(user) {
  return user.getExchanges();
}

/**
 * Find exchange by network
 * @param {Network} network - Netwerk we want the exchanges from
 * @method findExchangesByNetwork
 * @return {promise} Get exchanges promise
 */
export function findExchangesByNetwork(network) {
  return network.getExchanges();
}

/**
 * Find exchanges by team
 * @param {Team} team - Team we want the exchanges from
 * @method findExchangesByTeam
 * @return {promise} Get exchanges promise
 */
export function findExchangesByTeam(team) {
  return team.getExchanges();
}

/**
 * Delete a specific exchange by id
 * @param {number} exchangeId - Id of exchange to be deleted
 * @method deleteExchangeById
 * @return {promise} Delete exchange promise
 */
export function deleteExchangeById(exchangeId) {
  return findExchangeById(exchangeId)
    .then(exchange => exchange.destroy());
}

/**
 * Create a new exchange
 * @param {number} userId - Id of the user placing the exchange
 * @param {number} networkId - Id of the network the exchange is being placed in
 * @param {object} payload - Object containing payload data
 * @method createExchange
 * @return {promise} Create exchange promise
 */
export function createExchange(userId, networkId, payload) {
  const { title, description, date, type } = payload;

  return Exchange
    .create({ userId, networkId, title, description, date, type });
}

/**
 * Update an existing exchange by id
 * @param {number} exchangeId - Id of the exchange being updated
 * @param {object} payload - Objecting containing payload data
 * @method updateExchangeById
 * @return {promise} Update exchange promise
 */
export function updateExchangeById(exchangeId, payload) {
  const { title, description } = payload;

  return findExchangeById(exchangeId)
    .then(exchange => exchange.update({ title, description }));
}

/**
 * Add a response to an exchange
 * @param {Exchange} exchange - Exchange to add the response to
 * @param {User} user - User accepting the exchange
 * @method acceptExchange
 * @return {promise} Add exchange response promise
 */
export function acceptExchange(exchange, user) {
  const data = {
    userId: user.id,
    exchangeId: exchange.id,
    response: 1,
  };

  return findExchangeResponseByExchangeAndUser(exchange, user.id)
    .then(exchangeResponse => {
      if (!exchangeResponse) return createExchangeResponse(data);

      if (!exchangeResponse.response) {
        return removeExchangeResponseForExchangeAndUser(exchange, user)
          .then(createExchangeResponse(data));
      }
    })
    .then(() => findExchangeById(exchange.id));
}

/**
 * Add a response to an exchange
 * @param {Exchange} exchange - Exchange to add the response to
 * @param {User} user - User declining the exchange
 * @method declineExchange
 * @return {promise} Add exchange response promise
 */
export function declineExchange(exchange, user) {
  const data = {
    userId: user.id,
    exchangeId: exchange.id,
    response: 0,
  };

  return findExchangeResponseByExchangeAndUser(exchange, user.id)
    .then(exchangeResponse => {
      if (!exchangeResponse) return createExchangeResponse(data);

      if (exchangeResponse.response) {
        return removeExchangeResponseForExchangeAndUser(exchange, user)
          .then(createExchangeResponse(data));
      }
    });
}

/**
 * Approve an exchange
 * @param {Exchange} exchange - Exchange to approve
 * @param {User} user - User that approves the exchange
 * @param {User} userIdToApprove - User that will be approved
 * @method approveExchange
 * @return {promise} Promise containing the updated exchange
 */
export function approveExchange(exchange, user, userIdToApprove) {
  return findExchangeResponseByExchangeAndUser(exchange, userIdToApprove)
    .then(exchangeResponse => exchangeResponse.update({ approved: 1 }))
    .then(() => exchange.update({ approved_by: user.id, approved_user: userIdToApprove }));
}

/**
 * Increment the accept count by value
 * @param {Exchange} exchange - The exchange instance to increment on
 * @param {number} amount - The amount to increment
 * @method incrementExchangeAcceptCount
 * @return {promise} New promise with incremented value
 */
export function incrementExchangeAcceptCount(exchange, amount = 1) {
  return exchange.increment({ acceptCount: amount });
}

/**
 * Decrement the accept count by value
 * @param {Exchange} exchange - The exchange instance to decrement on
 * @param {number} amount - The amount to decrement
 * @method decrementExchangeAcceptCount
 * @return {promise} New promise with decremented value
 */
export function decrementExchangeAcceptCount(exchange, amount = 1) {
  return exchange.decrement({ acceptCount: amount });
}

/**
 * Increment the decline count by value
 * @param {Exchange} exchange - The exchange instance to increment on
 * @param {number} amount - The amount to increment
 * @method incrementExchangeDeclineCount
 * @return {promise} New promise with incremented value
 */
export function incrementExchangeDeclineCount(exchange, amount = 1) {
  return exchange.increment({ declineCount: amount });
}

/**
 * Decrement the decline count by value
 * @param {Exchange} exchange - The exchange instance to decrement on
 * @param {number} amount - The amount to increment
 * @method decrementExchangeDeclineCount
 * @return {promise} New promise with decremented value
 */
export function decrementExchangeDeclineCount(exchange, amount = 1) {
  return exchange.decrement({ declineCount: amount });
}
