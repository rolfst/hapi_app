import moment from 'moment';
import { map, omit, merge } from 'lodash';
import createError from '../../../shared/utils/create-error';
import { ActivityTypes } from '../../../shared/models/activity';
import { createActivity } from '../../core/repositories/activity';
import { User } from '../../../shared/models';
import makeCreatedInObject from '../utils/created-in-text';
import { exchangeTypes } from './dao/exchange';
import {
  Exchange, ExchangeResponse, ExchangeComment, ExchangeValue,
} from './dao';
import { createExchangeResponse } from './exchange-response';
import { createValuesForExchange } from './exchange-value';
import * as exchangeResponseRepo from './exchange-response';

/**
 * @module modules/flexchange/repositories/exchange
 */

const defaultIncludes = [
    { model: User },
    { model: User, as: 'Approver' },
    { model: User, as: 'ApprovedUser' },
    { model: ExchangeValue },
];

const createDateFilter = (filter) => {
  let dateFilter;

  if (filter.start && filter.end) {
    dateFilter = { $between: [filter.start, filter.end] };
  } else if (filter.start && !filter.end) {
    dateFilter = { $gte: filter.start };
  }

  return dateFilter;
};

/**
 * @param {object} [date=null] - moment, or parsable object
 * @method findAllAcceptedExchanges
 * @returns {Array<Exchange>} - Promise of list with Exchange objects
 */
export const findAllAcceptedExchanges = async (date = null) => {
  const query = {
    acceptCount: { $gt: 0 },
    approvedBy: { $eq: null },
  };

  if (date) {
    const momentObject = moment.isMoment(date) ? date : moment(date);
    const selectedDate = momentObject.format('YYYY-MM-DD');
    query.date = selectedDate;
  }

  const exchanges = await Exchange.findAll({
    where: query,
  });

  return exchanges;
};

/**
 * Find a specific exchange by id
 * @param {number} exchangeId - Id of exchange being looked for
 * @param {number} userId - Id of the user to use in includes
 * @method findExchangeById
 * @return {external:Promise.<Exchange>} Find exchange promise
 */
export async function findExchangeById(exchangeId, userId) {
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

  if (!exchange) throw createError('404');

  return exchange;
}

/**
 * Find a specific exchange by ids
 * @param {string} exchangeIds - Id of exchange being looked for
 * @param {string} userId - Id of the user to use in includes
 * @param {object} [extraConstraint={}] - extra query params
 * @method findExchangeByIds
 * @return {external:Promise.<Exchange>} Find exchanges promise
 */
export function findExchangeByIds(exchangeIds, userId, extraConstraint = {}) {
  const extraIncludes = [{
    model: ExchangeResponse,
    as: 'ResponseStatus',
    where: { userId },
    required: false,
  },
  { model: ExchangeResponse },
  { model: ExchangeComment, as: 'Comments' }];

  const options = {
    where: { id: { $in: exchangeIds } },
    include: [...defaultIncludes, ...extraIncludes],
  };

  return Exchange.findAll(merge(options, extraConstraint));
}

export function findByIds(exchangeIds) {
  return Exchange.findAll({ where: { id: { $in: exchangeIds } } });
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
 * @param {number} userId - Id of the user we want the exchanges from
 * @method findExchangesByUserAndNetwork
 * @return {Promise} Get exchanges promise
 */
export const findExchangesByUserAndNetwork = async (userId, networkId, filter = {}) => {
  const exchanges = await Exchange.findAll({
    attributes: ['id'],
    where: { userId, networkId },
  });

  const dateFilter = createDateFilter(filter);
  const constraint = dateFilter ? { where: { date: dateFilter } } : {};

  return findExchangeByIds(map(exchanges, 'id'), userId, constraint);
};

export async function findExchangesForValues(type, networkId, values, userId, filter = {}) {
  const validExchangeResult = await Exchange.findAll({
    attributes: ['id'],
    where: { type, networkId },
    include: [{
      model: ExchangeValue,
      required: true,
      where: { value: { $in: values } },
    }],
  });

  const validExchangeIds = validExchangeResult.map(exchange => exchange.id);
  const dateFilter = createDateFilter(filter);
  const constraint = dateFilter ? { where: { date: dateFilter } } : {};

  return findExchangeByIds(validExchangeIds, userId, constraint);
}

/**
 * Find exchange by network
 * @param {Network} network - Netwerk we want the exchanges from
 * @method findExchangesByNetwork
 * @return {Promise} Get exchanges promise
 */
export const findExchangesByNetwork = async (networkId, userId, filter = {}) => {
  const exchanges = await Exchange.findAll({
    attributes: ['id'],
    where: { networkId },
  });

  const dateFilter = createDateFilter(filter);
  const constraint = dateFilter ? { where: { date: dateFilter } } : {};

  return findExchangeByIds(map(exchanges, 'id'), userId, constraint);
};

/**
 * Find exchanges by team
 * @param {Team} team - Team we want the exchanges from
 * @method findExchangesByTeam
 * @return {Promise} Get exchanges promise
 */
export const findExchangesByTeam = async (team, userId, filter = {}) => {
  const exchanges = await team.getExchanges({ attributes: ['id'] });
  const exchangeIds = exchanges.map(e => e.id);
  const dateFilter = createDateFilter(filter);
  const constraint = dateFilter ? { where: { date: dateFilter } } : {};

  return findExchangeByIds(exchangeIds, userId, constraint);
};

/**
 * Delete a specific exchange by id
 * @param {number} exchangeId - Id of exchange to be deleted
 * @method deleteById
 * @return {Promise} Delete exchange promise
 */
export function deleteById(exchangeId) {
  return Exchange.destroy({ where: { id: exchangeId } });
}

/**
 * Create a new exchange for network
 * @param {number} userId - Id of the user placing the exchange
 * @param {number} networkId - Id of the network the exchange is being placed in
 * @param {object} attributes - Object containing attributes
 * @method createExchange
 * @return {Promise} Create exchange promise
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

  return findExchangeById(exchange.id);
}

export const getRespondedToExchange = async (userId, networkId) => {
  const exchanges = await Exchange.findAll({
    attributes: ['id'],
    where: { networkId },
    include: [{
      model: ExchangeResponse,
      where: { userId, $and: [{ response: 1 }, { $or: [{ approved: 1 }, { approved: null }] }] },
    }],
  });

  const exchangeIds = exchanges.map(e => e.id);

  return findExchangeByIds(exchangeIds, userId);
};

/**
 * Update an existing exchange by id
 * @param {number} exchangeId - Id of the exchange being updated
 * @param {object} payload - Objecting containing payload data
 * @method updateExchangeById
 * @return {Promise} Update exchange promise
 */
export function updateExchangeById(exchangeId, payload) {
  return Exchange.findById(exchangeId)
    .then(exchange => exchange.update(payload));
}

/**
 * Increment the accept count by value
 * @param {Exchange} exchange - The exchange instance to increment on
 * @param {number} amount - The amount to increment
 * @method incrementExchangeAcceptCount
 * @return {Promise} New promise with incremented value
 */
export function incrementExchangeAcceptCount(exchange, amount = 1) {
  return exchange.increment({ acceptCount: amount });
}

/**
 * Decrement the accept count by value
 * @param {Exchange} exchange - The exchange instance to decrement on
 * @param {number} amount - The amount to decrement
 * @method decrementExchangeAcceptCount
 * @return {Promise} New promise with decremented value
 */
export function decrementExchangeAcceptCount(exchange, amount = 1) {
  return exchange.decrement({ acceptCount: amount });
}

/**
 * Increment the decline count by value
 * @param {Exchange} exchange - The exchange instance to increment on
 * @param {number} amount - The amount to increment
 * @method incrementExchangeDeclineCount
 * @return {Promise} New promise with incremented value
 */
export function incrementExchangeDeclineCount(exchange, amount = 1) {
  return exchange.increment({ declineCount: amount });
}

/**
 * Decrement the decline count by value
 * @param {Exchange} exchange - The exchange instance to decrement on
 * @param {number} amount - The amount to increment
 * @method decrementExchangeDeclineCount
 * @return {Promise} New promise with decremented value
 */
export function decrementExchangeDeclineCount(exchange, amount = 1) {
  return exchange.decrement({ declineCount: amount });
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User declining the exchange
 * @param {number} response - Value of response
 * @method respondToExchange
 * @return {Promise} Respond to exchange promise
 */
export async function respondToExchange(exchangeId, userId, response) {
  const data = { userId, exchangeId, response };
  const exchange = await findExchangeById(exchangeId, userId);

  if (data.response === 0) await incrementExchangeDeclineCount(exchange);
  else if (data.response === 1) await incrementExchangeAcceptCount(exchange);

  const constraint = { exchangeId: exchange.id, userId };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (exchangeResponse) {
    await exchangeResponse.destroy();

    if (exchangeResponse.response === 0) await decrementExchangeDeclineCount(exchange);
    else if (exchangeResponse.response === 1) await decrementExchangeAcceptCount(exchange);

    await createExchangeResponse(data);
  } else {
    await createExchangeResponse(data);
  }

  return exchange.reload();
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User accepting the exchange
 * @method acceptExchange
 * @return {Promise} Add exchange response promise
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
 * @return {Promise} Add exchange response promise
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
 * @return {Promise} Promise containing the updated exchange
 */
export async function approveExchange(exchange, approvingUser, userIdToApprove) {
  const constraint = { exchangeId: exchange.id, userId: userIdToApprove };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (!exchangeResponse) throw createError('403', 'Cannot approve the exchange for this user.');

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
 * @param {User} rejectingUser - User that is rejecting the exchange
 * @param {string} userIdToReject - User that will be rejected
 * @method rejectExchange
 * @return {external:Promise<Exchange>} Promise containing the updated exchange
 */
export async function rejectExchange(exchange, rejectingUser, userIdToReject) {
  const constraint = { exchangeId: exchange.id, userId: userIdToReject };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (!exchangeResponse) throw createError('403', 'Cannot reject the exchange for this user.');

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
