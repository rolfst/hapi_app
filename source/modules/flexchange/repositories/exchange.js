import Boom from 'boom';
import { omit } from 'lodash';
import makeCreatedInObject from 'modules/flexchange/utils/created-in-text';
import { ActivityTypes } from 'common/models/activity';
import { createActivity } from 'common/repositories/activity';
import { User } from 'common/models';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import {
  Exchange, ExchangeResponse, ExchangeComment, ExchangeValue,
} from 'modules/flexchange/models';
import { createExchangeResponse } from 'modules/flexchange/repositories/exchange-response';
import { createValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
import {
  findExchangeResponseByExchangeAndUser,
  removeExchangeResponseForExchangeAndUser,
} from 'modules/flexchange/repositories/exchange-response';

const defaultIncludes = [
    { model: User },
    { model: User, as: 'Approver' },
    { model: User, as: 'ApprovedUser' },
    { model: ExchangeValue },
];

/**
 * Find a specific exchange by id
 * @param {number} exchangeId - Id of exchange being looked for
 * @param {number} userId - Id of the user to use in includes
 * @method findExchangeById
 * @return {promise} Find exchange promise
 */
export async function findExchangeById(exchangeId, userId) {
  try {
    const extraIncludes = [{
      model: ExchangeResponse,
      as: 'ResponseStatus',
      where: { userId },
      required: false,
    },
    { model: ExchangeResponse },
    { model: ExchangeComment, as: 'Comments' }];

    const exchange = await Exchange
      .findById(exchangeId, { include: [...defaultIncludes, ...extraIncludes] });

    if (!exchange) throw Boom.notFound(`No exchange found with id ${exchangeId}.`);

    return exchange;
  } catch (err) {
    throw err;
  }
}

/**
 * Find a specific exchange by ids
 * @param {number} exchangeIds - Id of exchange being looked for
 * @param {number} userId - Id of the user to use in includes
 * @method findExchangeByIds
 * @return {promise} Find exchanges promise
 */
export function findExchangeByIds(exchangeIds, userId) {
  const extraIncludes = [{
    model: ExchangeResponse,
    as: 'ResponseStatus',
    where: { userId },
    required: false,
  },
  { model: ExchangeResponse },
  { model: ExchangeComment, as: 'Comments' }];

  return Exchange.findAll({
    where: { id: { $in: exchangeIds } },
    include: [...defaultIncludes, ...extraIncludes],
  });
}

export async function findExchangesByShiftIds(shiftIds) {
  const exchanges = await Exchange.findAll({
    include: defaultIncludes,
    where: { shiftId: { $in: shiftIds } },
  });

  return exchanges;
}

/**
 * Find exchanges by user
 * @param {User} user - User we want the exchanges from
 * @method findExchangesByUser
 * @return {promise} Get exchanges promise
 */
export function findExchangesByUser(user) {
  const extraInclude = {
    model: ExchangeResponse,
    as: 'ResponseStatus',
    where: { userId: user.id },
    required: false,
  };

  return user.getExchanges({ include: [...defaultIncludes, extraInclude] });
}

export function findExchangesForModel(model, userId, includes = [], filter = {}) {
  const extraIncludes = [{ model: ExchangeResponse,
    as: 'ResponseStatus',
    where: { userId },
    required: false,
  }, ...includes];

  let dateFilter;

  const options = {
    include: [...defaultIncludes, ...extraIncludes],
  };

  if (filter.start && filter.end) {
    dateFilter = { $between: [filter.start, filter.end] };
  } else if (filter.start && !filter.end) {
    dateFilter = { $gte: filter.start };
  }

  if (dateFilter) options.where = { date: dateFilter };

  return model.getExchanges(options);
}

/**
 * Find exchange by network
 * @param {Network} network - Netwerk we want the exchanges from
 * @method findExchangesByNetwork
 * @return {promise} Get exchanges promise
 */
export function findExchangesByNetwork(network, userId, includes = [], filter = {}) {
  return findExchangesForModel(network, userId, includes, filter);
}

/**
 * Find exchanges by team
 * @param {Team} team - Team we want the exchanges from
 * @method findExchangesByTeam
 * @return {promise} Get exchanges promise
 */
export function findExchangesByTeam(team, userId, includes = [], filter = {}) {
  return findExchangesForModel(team, userId, includes, filter);
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
 * @param {object} attributes - Object containing attributes
 * @method createExchange
 * @return {promise} Create exchange promise
 */
export async function createExchange(userId, networkId, attributes) {
  const exchange = await Exchange.create({ ...omit(attributes, 'values'), userId, networkId });
  let exchangeValues;

  if (exchange.type === exchangeTypes.NETWORK) {
    exchangeValues = await createValuesForExchange(exchange.id, [networkId]);
  } else {
    exchangeValues = await createValuesForExchange(exchange.id, attributes.values);
  }

  exchange.ExchangeValues = exchangeValues;

  createActivity({
    activityType: ActivityTypes.EXCHANGE_CREATED,
    userId,
    sourceId: exchange.id,
    metaData: {
      created_in: makeCreatedInObject(exchange),
    },
  });

  return exchange.reload();
}

/**
 * Update an existing exchange by id
 * @param {number} exchangeId - Id of the exchange being updated
 * @param {object} payload - Objecting containing payload data
 * @method updateExchangeById
 * @return {promise} Update exchange promise
 */
export function updateExchangeById(exchangeId, payload) {
  return Exchange.findById(exchangeId)
    .then(exchange => exchange.update(payload));
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
  const exchange = await respondToExchange(exchangeId, userId, 1);

  createActivity({
    activityType: ActivityTypes.EXCHANGE_ACCEPTED,
    userId,
    sourceId: exchangeId,
  });

  return exchange;
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User declining the exchange
 * @method declineExchange
 * @return {promise} Add exchange response promise
 */
export async function declineExchange(exchangeId, userId) {
  const exchange = await respondToExchange(exchangeId, userId, 0);

  createActivity({
    activityType: ActivityTypes.EXCHANGE_DECLINED,
    userId,
    sourceId: exchangeId,
  });

  return exchange;
}

/**
 * Approve an exchange
 * @param {Exchange} exchange - Exchange to approve
 * @param {User} approvingUser - User that approves the exchange
 * @param {number} userIdToApprove - User that will be approved
 * @method approveExchange
 * @return {promise} Promise containing the updated exchange
 */
export async function approveExchange(exchange, approvingUser, userIdToApprove) {
  const exchangeResponse = await findExchangeResponseByExchangeAndUser(
    exchange.id, userIdToApprove
  );

  await Promise.all([
    exchangeResponse.update({ approved: 1 }),
    exchange.update({ approved_by: approvingUser.id, approved_user: userIdToApprove }),
  ]);

  createActivity({
    activityType: ActivityTypes.EXCHANGE_APPROVED,
    userId: approvingUser.id,
    sourceId: exchange.id,
    metaData: {
      approved_user_id: userIdToApprove,
    },
  });

  return exchange.reload();
}

/**
 * Reject an exchange
 * @param {Exchange} exchange - Exchange to reject
 * @param {number} userIdToReject - User that will be rejected
 * @method rejectExchange
 * @return {promise} Promise containing the updated exchange
 */
export async function rejectExchange(exchange, rejectingUser, userIdToReject) {
  const exchangeResponse = await findExchangeResponseByExchangeAndUser(
    exchange.id, userIdToReject
  );

  await exchangeResponse.update({ approved: 0 });

  createActivity({
    activityType: ActivityTypes.EXCHANGE_REJECTED,
    userId: rejectingUser.id,
    sourceId: exchange.id,
    metaData: {
      rejected_user_id: userIdToReject,
    },
  });

  return exchange.reload();
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
