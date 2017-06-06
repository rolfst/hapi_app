const moment = require('moment');
const R = require('ramda');
const { merge } = require('lodash');
const createError = require('../../../shared/utils/create-error');
const { ActivityTypes } = require('../../core/repositories/dao/activity');
const { createActivity } = require('../../core/repositories/activity');
const { User } = require('../../core/repositories/dao');
const makeCreatedInObject = require('../utils/created-in-text');
const createExchangeModel = require('../models/exchange');
const { exchangeTypes } = require('./dao/exchange');
const {
  Exchange, ExchangeResponse, ExchangeComment, ExchangeValue,
} = require('./dao');
const exchangeValuesRepo = require('./exchange-value');
const exchangeResponseRepo = require('./exchange-response');

/**
 * @module modules/flexchange/repositories/exchange
 */

const whereLens = R.lensProp('where');
const whereMerge = R.over(whereLens);

const defaultIncludes = [
    { model: User },
    { model: User, as: 'Approver' },
    { model: User, as: 'ApprovedUser' },
    { model: ExchangeValue },
];

// FIXME: Will be removed soon because duplicate code in implementation
const createDateFilter = (start, end) => {
  let dateFilter;

  if (start && end) {
    dateFilter = { $between: [start, end] };
  } else if (start && !end) {
    dateFilter = { $gte: start };
  }

  return dateFilter;
};

// NEW REFACTORED METHODS
const findAllBy = (whereConstraint) => Exchange
  .findAll({ where: whereConstraint })
  .then(R.map(createExchangeModel));

const findByIds = async (exchangeIds, filter) => {
  const result = await Exchange.findAll(R.merge({ where: { id: { $in: exchangeIds } } }, filter));

  return R.map(createExchangeModel, result);
};
// END OF NEW REFACTORED METHODS

/**
 * @param {object} [date=null] - moment, or parsable object
 * @method findAllAcceptedExchanges
 * @returns {Exchange[]} - Promise of list with Exchange objects
 */
const findAllAcceptedExchanges = async (date = null) => {
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
async function findExchangeById(exchangeId, userId) {
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
function findExchangeByIds(exchangeIds, userId, extraConstraint = {}) {
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

async function findExchangesByShiftIds(shiftIds) {
  const exchanges = await Exchange.findAll({
    include: defaultIncludes,
    where: { shiftId: { $in: shiftIds } },
  });

  return exchanges;
}

/**
 * Find exchanges by user
 * @param {number} userId - Id of the user we want the exchanges from
 * @param {string} networkId - id of the network the exchanges are searched for
 * @param {object} [filter] - filter object to limit the results
 * @param {date} filter.start
 * @param {date} filter.end
 * @method findExchangesByUserAndNetwork
 * @return {external:Promise.<Exchange>} Get exchanges promise
 */
const findExchangesByUserAndNetwork = async (userId, networkId, filter = {}) => {
  const dateFilter = createDateFilter(filter.start, filter.end);
  const constraint = dateFilter ? { date: dateFilter } : {};
  const options = { attributes: ['id'],
    where: { userId, networkId } };
  const mergeWithConstrainst = R.merge(constraint);
  const exchanges = await Exchange.findAll(
    whereMerge(mergeWithConstrainst, options)
  );

  return R.pluck('id', exchanges);
};

async function findExchangeIdsForValues(type, networkId, values, userId, filter = {}) {
  const whereConstraint = { type, networkId };
  const dateFilter = createDateFilter(filter.start);
  if (dateFilter) whereConstraint.date = dateFilter;

  const exchangeResult = await Exchange.findAll({
    attributes: ['id'],
    where: whereConstraint,
    include: [{
      model: ExchangeValue,
      required: true,
      where: { value: { $in: values } },
    }],
  });

  return R.pluck('id', exchangeResult);
}

/**
 * Find exchange by network
 * @param {Network} network - Netwerk we want the exchanges from
 * @method findExchangesByNetwork
 * @return {Promise} Get exchanges promise
 */
const findExchangesByNetwork = async (networkId, options = {}) => {
  const opts = { where: { networkId } };
  if (options.start || options.end) opts.where.date = createDateFilter(options.start, options.end);
  if (options.attributes) opts.attributes = options.attributes;

  const exchanges = await Exchange.findAll(opts);

  return R.map(createExchangeModel, exchanges);
};

/**
 * Delete a specific exchange by id
 * @param {number} exchangeId - Id of exchange to be deleted
 * @method deleteById
 * @return {Promise} Delete exchange promise
 */
function deleteById(exchangeId) {
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
async function createExchange(userId, networkId, attributes) {
  const exchange = await Exchange.create(R.merge(
        R.omit(['values'], attributes), { userId, networkId }));
  let exchangeValues;

  if (exchange.type === exchangeTypes.NETWORK) {
    exchangeValues = await exchangeValuesRepo.createValuesForExchange(exchange.id, [networkId]);
  } else {
    exchangeValues = await exchangeValuesRepo.createValuesForExchange(
      exchange.id, attributes.values);
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
// TODO Does not provide all properties that are supposed to be in an exchange
const findRespondedExchangesForUser = async (userId, networkId) => {
  const exchanges = await Exchange.findAll({
    attributes: ['id'],
    where: { networkId },
    include: [{
      model: ExchangeResponse,
      where: { userId, $and: [{ response: 1 }, { $or: [{ approved: 1 }, { approved: null }] }] },
    }],
  });

  const exchangeIds = exchanges.map((e) => e.id);

  return findExchangeByIds(exchangeIds, userId);
};

/**
 * Update an existing exchange by id
 * @param {number} exchangeId - Id of the exchange being updated
 * @param {object} payload - Objecting containing payload data
 * @method updateExchangeById
 * @return {Promise} Update exchange promise
 */
function updateExchangeById(exchangeId, payload) {
  return Exchange.findById(exchangeId)
    .then((exchange) => exchange.update(payload));
}

/**
 * Increment the accept count by value
 * @param {Exchange} exchange - The exchange instance to increment on
 * @param {number} amount - The amount to increment
 * @method incrementExchangeAcceptCount
 * @return {Promise} New promise with incremented value
 */
function incrementExchangeAcceptCount(exchange, amount = 1) {
  return exchange.increment({ acceptCount: amount });
}

/**
 * Decrement the accept count by value
 * @param {Exchange} exchange - The exchange instance to decrement on
 * @param {number} amount - The amount to decrement
 * @method decrementExchangeAcceptCount
 * @return {Promise} New promise with decremented value
 */
function decrementExchangeAcceptCount(exchange, amount = 1) {
  return exchange.decrement({ acceptCount: amount });
}

/**
 * Increment the decline count by value
 * @param {Exchange} exchange - The exchange instance to increment on
 * @param {number} amount - The amount to increment
 * @method incrementExchangeDeclineCount
 * @return {Promise} New promise with incremented value
 */
function incrementExchangeDeclineCount(exchange, amount = 1) {
  return exchange.increment({ declineCount: amount });
}

/**
 * Decrement the decline count by value
 * @param {Exchange} exchange - The exchange instance to decrement on
 * @param {number} amount - The amount to increment
 * @method decrementExchangeDeclineCount
 * @return {Promise} New promise with decremented value
 */
function decrementExchangeDeclineCount(exchange, amount = 1) {
  return exchange.decrement({ declineCount: amount });
}


async function incrementResponseCount(responseCount, exchange) {
  if (responseCount === 0) await incrementExchangeDeclineCount(exchange);
  else if (responseCount === 1) await incrementExchangeAcceptCount(exchange);
}

async function decrementResponseCount(responseCount, exchange) {
  if (responseCount === 0) await decrementExchangeDeclineCount(exchange);
  else if (responseCount === 1) await decrementExchangeAcceptCount(exchange);
}
/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User declining the exchange
 * @param {number} response - Value of response
 * @method respondToExchange
 * @return {Promise.<string>} Id of the exchange
 */
async function respondToExchange(exchangeId, userId, response) {
  const data = { userId, exchangeId, response };
  const exchange = await findExchangeById(exchangeId, userId);

  incrementResponseCount(data.response, exchange);

  const constraint = { exchangeId: exchange.id, userId };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (exchangeResponse) {
    await exchangeResponse.destroy();
    decrementResponseCount(exchangeResponse.response, exchange);
  }
  await exchangeResponseRepo.createExchangeResponse(data);

  return exchange.id;
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User accepting the exchange
 * @method acceptExchange
 * @return {Promise.<string>} id of the response
 */
async function acceptExchange(exchangeId, userId) {
  const id = await respondToExchange(exchangeId, userId, 1);

  createActivity({
    activityType: ActivityTypes.EXCHANGE_ACCEPTED,
    userId,
    sourceId: exchangeId,
  });

  return id;
}

/**
 * Add a response to an exchange
 * @param {number} exchangeId - Exchange to add the response to
 * @param {number} userId - User declining the exchange
 * @method declineExchange
 * @return {Promise} Add exchange response promise
 */
async function declineExchange(exchangeId, userId) {
  const exchange = await respondToExchange(exchangeId, userId, 0);

  createActivity({
    activityType: ActivityTypes.EXCHANGE_DECLINED,
    userId,
    sourceId: exchangeId,
  });

  return exchange;
}

/**
 * Updates an exchange
 * @param {object} constraint - fields used to match the correct exchange to be updated
 * @param {object} data - the data that needs to be updated
 */
function update(constraint, data) {
  Exchange.update(data, constraint);
}

/**
 * Approve an exchange
 * @param {Exchange} exchange - Exchange to approve
 * @param {User} approvingUser - User that approves the exchange
 * @param {number} userIdToApprove - User that will be approved
 * @method approveExchange
 * @return {Promise} Promise containing the updated exchange
 */
async function approveExchange(exchange, approvingUser, userIdToApprove) {
  const constraint = { where: { exchangeId: exchange.id, userId: userIdToApprove } };

  await Promise.all([
    exchangeResponseRepo.update(constraint, { approved: 1 }),
    update({ where: { id: exchange.id } },
      { approved_by: approvingUser.id, approved_user: userIdToApprove }),
  ]);

  createActivity({
    activityType: ActivityTypes.EXCHANGE_APPROVED,
    userId: approvingUser.id,
    sourceId: exchange.id,
    metaData: {
      approved_user_id: userIdToApprove,
    },
  });

  return exchange.id;
}

/**
 * Reject an exchange
 * @param {Exchange} exchange - Exchange to reject
 * @param {User} rejectingUser - User that is rejecting the exchange
 * @param {string} userIdToReject - User that will be rejected
 * @method rejectExchange
 * @return {external:Promise<Exchange>} Promise containing the updated exchange
 */
async function rejectExchange(exchange, rejectingUser, userIdToReject) {
  const constraint = { exchangeId: exchange.id, userId: userIdToReject };
  await exchangeResponseRepo.update({ where: constraint }, { approved: 0 });

  createActivity({
    activityType: ActivityTypes.EXCHANGE_REJECTED,
    userId: rejectingUser.id,
    sourceId: exchange.id,
    metaData: {
      rejected_user_id: userIdToReject,
    },
  });

  return exchange.id;
}

const getApprovedExchange = (exchangeId) => Exchange
  .findOne({
    where: { id: exchangeId },
    include: [
      { model: User },
      { model: User, as: 'Approver' },
      { model: User, as: 'ApprovedUser' },
    ],
  });

exports.acceptExchange = acceptExchange;
exports.approveExchange = approveExchange;
exports.createExchange = createExchange;
exports.declineExchange = declineExchange;
exports.decrementExchangeAcceptCount = decrementExchangeAcceptCount;
exports.decrementExchangeDeclineCount = decrementExchangeDeclineCount;
exports.deleteById = deleteById;
exports.findAllAcceptedExchanges = findAllAcceptedExchanges;
exports.findAllBy = findAllBy;
exports.findByIds = findByIds;
exports.findExchangeById = findExchangeById;
exports.findExchangeByIds = findExchangeByIds;
exports.findExchangeIdsForValues = findExchangeIdsForValues;
exports.findExchangesByNetwork = findExchangesByNetwork;
exports.findExchangesByShiftIds = findExchangesByShiftIds;
exports.findExchangesByUserAndNetwork = findExchangesByUserAndNetwork;
exports.findRespondedExchangesForUser = findRespondedExchangesForUser;
exports.incrementExchangeAcceptCount = incrementExchangeAcceptCount;
exports.incrementExchangeDeclineCount = incrementExchangeDeclineCount;
exports.rejectExchange = rejectExchange;
exports.respondToExchange = respondToExchange;
exports.updateExchangeById = updateExchangeById;
exports.getApprovedExchange = getApprovedExchange;
