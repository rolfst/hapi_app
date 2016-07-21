import Boom from 'boom';
import {
  Exchange, ExchangeResponse, ExchangeComment, ExchangeValue,
} from 'modules/flexchange/models';
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
export async function findExchangeById(exchangeId, userId) {
  try {
    const exchange = await Exchange
      .findById(exchangeId, {
        include: [
          { model: User, as: 'ApprovedUser' },
          { model: ExchangeResponse },
          { model: ExchangeComment, as: 'Comments' },
          { model: ExchangeValue },
          { model: ExchangeResponse,
            as: 'ResponseStatus',
            where: { userId },
            required: false,
          },
        ],
      });

    if (!exchange) throw Boom.notFound(`No exchange found with id ${exchangeId}.`);

    return exchange;
  } catch (err) {
    throw err;
  }
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
export function findExchangesByNetwork(network, userId, includes = []) {
  return network.getExchanges({
    include: [...includes, { model: ExchangeResponse,
      as: 'ResponseStatus',
      where: { userId },
      required: false,
    }],
  });
}

/**
 * Find exchanges by team
 * @param {Team} team - Team we want the exchanges from
 * @method findExchangesByTeam
 * @return {promise} Get exchanges promise
 */
export function findExchangesByTeam(team, userId, includes = []) {
  return team.getExchanges({
    include: [...includes, { model: ExchangeResponse,
      as: 'ResponseStatus',
      where: { userId },
      required: false,
    }],
  });
}

/**
 * Delete a specific exchange by id
 * @param {number} exchangeId - Id of exchange to be deleted
 * @method deleteExchangeById
 * @return {promise} Delete exchange promise
 */
export function deleteExchangeById(exchangeId) {
  return Exchange.findById(exchangeId)
    .then(exchange => exchange.destroy());
}

/**
 * Create a new exchange for network
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

  return Exchange.findById(exchangeId)
    .then(exchange => exchange.update({ title, description }));
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User declining the exchange
 * @param {number} response - Value of response
 * @method respondToExchange
 * @return {promise} Respond to exchange promise
 */
export async function respondToExchange(exchangeId, userId, response) {
  const data = { userId, exchangeId, response };
  const exchange = await findExchangeById(exchangeId, userId);

  try {
    const exchangeResponse = await findExchangeResponseByExchangeAndUser(exchange.id, userId);

    if (!exchangeResponse.response) {
      await removeExchangeResponseForExchangeAndUser(exchange.id, userId);
      await createExchangeResponse(data);
    }
  } catch (err) {
    await createExchangeResponse(data);
  }

  return exchange.reload();
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User accepting the exchange
 * @method acceptExchange
 * @return {promise} Add exchange response promise
 */
export async function acceptExchange(exchangeId, userId) {
  return respondToExchange(exchangeId, userId, 1);
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User declining the exchange
 * @method declineExchange
 * @return {promise} Add exchange response promise
 */
export async function declineExchange(exchangeId, userId) {
  return respondToExchange(exchangeId, userId, 0);
}

/**
 * Approve an exchange
 * @param {Exchange} exchange - Exchange to approve
 * @param {User} user - User that approves the exchange
 * @param {number} userIdToApprove - User that will be approved
 * @method approveExchange
 * @return {promise} Promise containing the updated exchange
 */
export function approveExchange(exchange, user, userIdToApprove) {
  return findExchangeResponseByExchangeAndUser(exchange.id, userIdToApprove)
    .then(exchangeResponse => exchangeResponse.update({ approved: 1 }))
    .then(() => exchange.update({ approved_by: user.id, approved_user: userIdToApprove }))
    .then(() => exchange.reload());
}

/**
 * Reject an exchange
 * @param {Exchange} exchange - Exchange to reject
 * @param {number} userIdToReject - User that will be rejected
 * @method rejectExchange
 * @return {promise} Promise containing the updated exchange
 */
export function rejectExchange(exchange, userIdToReject) {
  return findExchangeResponseByExchangeAndUser(exchange.id, userIdToReject)
    .then(exchangeResponse => exchangeResponse.update({ approved: 0 }))
    .then(() => exchange);
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
