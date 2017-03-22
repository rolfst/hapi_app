const { sortBy, map, includes } = require('lodash');
const R = require('ramda');
const moment = require('moment');
const Logger = require('../../../../shared/services/logger');
const { createAdapter } = require('../../../../shared/utils/create-adapter');
const createError = require('../../../../shared/utils/create-error');
const teamRepo = require('../../../core/repositories/team');
const userRepo = require('../../../core/repositories/user');
const activityRepo = require('../../../core/repositories/activity');
const userService = require('../../../core/services/user');
const teamService = require('../../../core/services/team');
const objectService = require('../../../core/services/object');
const networkService = require('../../../core/services/network');
const { exchangeTypes } = require('../../repositories/dao/exchange');
const commentRepo = require('../../repositories/comment');
const exchangeRepo = require('../../repositories/exchange');
const exchangeValueRepo = require('../../repositories/exchange-value');
const exchangeResponseRepo = require('../../repositories/exchange-response');
const acceptanceNotifier = require('../../notifications/accepted-exchange');
const FlexchangeDispatcher = require('../../dispatcher');
const impl = require('./implementation');

/**
 * @module modules/flexchange/services/flexchange
 */
const logger = Logger.createLogger('FLEXCHANGE/service/exchange');

const FILTER_PROPERTIES = ['start', 'end'];

const isExpired = (date) => moment(date).diff(moment(), 'days') < 0;

/**
 * Lists exchanges for network by id
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.exchangeIds - The id of the exchanges to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange}
 */
const list = async (payload, message) => {
  logger.info('Listing exchanges', { payload, message });

  const [exchanges, responsesForExchanges, valuesForExchanges] = await Promise.all([
    exchangeRepo.findByIds(payload.exchangeIds),
    exchangeResponseRepo.findAllWhere({
      exchangeId: { $in: payload.exchangeIds } }),
    exchangeValueRepo.findAllWhere({
      exchangeId: { $in: payload.exchangeIds },
    }).then(impl.groupValuesPerExchange),
  ]);

  const occuringUsers = await R.pipe(
    impl.getUserIdsInObjects(['approvedUser', 'approvedBy', 'userId']),
    (userIds) => userService.listUsersWithNetworkScope({
      networkId: message.network.id, userIds }, message)
  )(R.concat(exchanges, responsesForExchanges));

  const responsesForExchange = (exchangeId) =>
    R.filter(R.propEq('exchangeId', exchangeId), responsesForExchanges) || [];

  const responseForUser = (userId, exchangeId) =>
    R.find(R.propEq('userId', userId), responsesForExchange(exchangeId));

  const findUserById = impl.findUserById(occuringUsers);

  return R.map((exchange) => R.merge(exchange, {
    createdIn: impl.makeCreatedInObject(
      impl.addValues(valuesForExchanges, exchange)),
    user: findUserById(exchange.userId),
    approvedUser: findUserById(exchange.approvedUserId),
    responseStatus: impl.createResponseStatus(
      responseForUser(message.credentials.id, exchange.id)),
    responses: impl.replaceUsersInResponses(
      occuringUsers, responsesForExchange(exchange.id)),
  }), exchanges);
};

/**
 * Lists the possible receivers for an exchange
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to fetch the receivers for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listReceivers
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User} -
 * Promise with list of receivers for this exchange
 */
const listReceivers = async (payload, message) => {
  logger.info('Listing receivers for exchange', { payload, message });
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);
  const valueIds = R.pluck('value', exchange.ExchangeValues);
  let receivers;

  if (exchange.type === exchangeTypes.NETWORK) {
    const networkPayload = { networkId: valueIds[0] };
    receivers = await networkService.listActiveUsersForNetwork(networkPayload, message);
  } else if (exchange.type === exchangeTypes.TEAM) {
    const teamPayload = { teamIds: valueIds };
    receivers = await teamService.listMembersForTeams(teamPayload, message);
  } else if (exchange.type === exchangeTypes.USER) {
    const userPayload = { userIds: valueIds, networkId: message.network.id };
    receivers = await userService.listUsersWithNetworkScope(userPayload, message);
  }

  return R.reject(R.propEq('id', message.credentials.id), receivers);
};

/**
 * Accept an exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to fetch the receivers for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method acceptExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the accepted exchange
 */
const acceptExchange = async (payload, message) => {
  logger.info('Accepting exchange', { payload, message });
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);

  if (isExpired(exchange.date)) throw createError('403', 'The exchange is expired.');
  if (exchange.approvedBy) throw createError('403', 'The exchange is already approved.');

  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw createError('403', 'You are already rejected for the exchange.');

  const acceptedExchange = await exchangeRepo.acceptExchange(exchange.id, message.credentials.id);
  const acceptanceUser = await userService.getUser(
    { userId: message.credentials.id },
    { networkId: message.network.id }
  );

  acceptanceNotifier.send(message.network, acceptedExchange, acceptanceUser);
  objectService.remove({
    parentType: 'user',
    parentId: message.credentials.id,
    objectType: 'exchange',
    sourceId: payload.exchangeId,
  });

  const exchanges = await list({ exchangeIds: [payload.exchangeId] }, message);

  return exchanges[0];
};

/**
 * Approve an accepted exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to fetch the receivers for
 * @param {string} payload.userId - The id of the user that has accepted the exchange
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method approveExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the accepted exchange
 */
const approveExchange = async (payload, message) => {
  logger.info('Approving exchange', { payload, message });
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);

  const constraint = { exchangeId: payload.exchangeId, userId: payload.userId };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (!exchangeResponse) {
    throw createError('403', 'You cannot approve a user that did not accept the exchange.');
  }

  impl.validateExchangeResponse(exchangeResponse);

  const approvedExchange = await exchangeRepo.approveExchange(exchange,
    message.credentials,
    payload.userId);

  if (approvedExchange) {
    FlexchangeDispatcher.emit('exchange.approved', {
      exchange: approvedExchange,
      network: message.network,
      credentials: message.credentials,
      approvedUser: exchangeResponse.User,
    });
  }

  const exchanges = await list({ exchangeIds: [payload.exchangeId] }, message);

  return exchanges[0];
};

/**
 * Lists all exchanges who the user has responded to.
 * @param {object} payload - Object containing payload data
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listRespondedTo
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the accepted exchange
 */
const listRespondedTo = async (payload, message) => {
  const { network, credentials } = message;

  return exchangeRepo.getRespondedToExchange(credentials.id, network.id);
};

/**
 * Declines an exchange by a user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to decline
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method declineExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the declined exchange
 */
const declineExchange = async (payload, message) => {
  logger.info('Declining exchange', { payload, message });
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw createError('403', 'You are already rejected for the exchange.');

  await exchangeRepo.declineExchange(exchange.id, message.credentials.id);
  objectService.remove({
    parentType: 'user',
    parentId: message.credentials.id,
    objectType: 'exchange',
    sourceId: payload.exchangeId,
  });

  const exchanges = await list({ exchangeIds: [payload.exchangeId] }, message);

  return exchanges[0];
};

/**
 * Lists all shifts for user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to decline
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMyShifts
 * @return {external:Promise.<Shift[]>} {@link module:modules/flexchange~Shift Shift} -
 * Promise with list of shifts
 */
const listMyShifts = async (payload, message) => {
  logger.info('Listing my shifts', { payload, message });
  const { network } = message;

  if (!network.hasIntegration) throw createError('10001');

  const adapter = await createAdapter(network, message.credentials.id);
  const shifts = await adapter.myShifts();

  const [exchanges, teams] = await Promise.all([
    exchangeRepo.findExchangesByShiftIds(map(shifts, 'id')),
    teamRepo.findTeamsByExternalId(network.id, map(shifts, 'team_id')),
  ]);

  return impl.mapShiftsWithExchangeAndTeam(shifts, exchanges, teams);
};

const deleteExchange = async (payload, message) => {
  logger.info('Deleting exchange', { payload, message });

  return Promise.all([
    objectService.remove({ objectType: 'exchange', sourceId: payload.exchangeId }),
    activityRepo.deleteBy({
      activityType: { $in: [
        'exchange_created', 'exchange_declined', 'exchange_accepted',
        'exchange_comment', 'exchange_approved', 'exchange_rejected',
      ] },
      sourceId: payload.exchangeId,
    }),
    exchangeRepo.deleteById(payload.exchangeId),
  ]);
};

/**
 * Rejects an acceptance response for the exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to reject
 * @param {string} payload.userId - The id of the user to reject
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method rejectExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the rejected exchange
 */
const rejectExchange = async (payload, message) => {
  logger.info('Rejecting exchange', { payload, message });
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId,
    message.credentials.id);
  const constraint = { exchangeId: exchange.id, userId: payload.userId };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  impl.validateExchangeResponse(exchangeResponse);

  const rejectedExchange = await exchangeRepo.rejectExchange(
    exchange, message.credentials, payload.userId);
  await rejectedExchange.reload();
  // TODO: Fire ExchangeWasRejected event

  const exchanges = await list({ exchangeIds: [payload.exchangeId] }, message);

  return exchanges[0];
};

/**
 * Gets a single Exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to fetch
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with an Exchange
 */
const getExchange = async (payload, message) => {
  const { credentials } = message;

  return exchangeRepo.findExchangeById(payload.exchangeId, credentials.id);
};

/**
 * Lists Comments.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to retrieve the comments for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listComments
 * @return {external:Promise.<Comment>} {@link module:modules/flexchange~Comment Comment} -
 * Promise with a list of comments for an exchange
 */
const listComments = async (payload, message) => {
  logger.info('Listing comments for exchange', { payload, message });
  const userId = message.credentials.id;
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, userId);

  return commentRepo.findCommentsByExchange(exchange);
};

/**
 * Gets a single Shift.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.shiftId - The id of the shift to fetch
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method getExchange
 * @return {external:Promise.<Shift>} {@link module:modules/flexchange~Shift Shift} -
 * Promise with a Shift
 */
const getShift = async (payload, message) => {
  if (!message.network.hasIntegration) throw createError('10001');

  const adapter = await createAdapter(message.network, message.credentials.id);
  const shift = await adapter.viewShift(payload.shiftId);

  if (!shift) throw createError('404');

  const [exchanges, teams] = await Promise.all([
    exchangeRepo.findExchangesByShiftIds([shift.id]),
    teamRepo.findTeamsByExternalId(message.network.id, [shift.team_id]),
  ]);

  return impl.mergeShiftWithExchangeAndTeam(shift, exchanges[0], teams[0]);
};

/**
 * Lists available Users for a certain shift.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.shiftId - The id of the shift to fetch
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listAvailableUsersForShift
 * @return {external:Promise.<User[]>} {@link module:modules/core~User User} -
 * Promise with a list of Users
 */
const listAvailableUsersForShift = async (payload, message) => {
  logger.info('Listing available users for shift', { payload, message });
  if (!message.network.hasIntegration) throw createError('10001');

  const adapter = await createAdapter(message.network, message.credentials.id);
  const externalUsers = await adapter.usersAvailableForShift(payload.shiftId);
  const availableUsers = await userRepo.findExternalUsers(R.pluck('externalId', externalUsers));

  return userService.listUsersWithNetworkScope({
    userIds: map(availableUsers, 'id'),
    networkId: message.network.id,
  }, message);
};

/**
 * Lists exchanges for a team.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.teamId - The id of the shift to fetch
 * @param {string} payload.start - start of the offset
 * @param {string} payload.end - end of the offset
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listExchangesForTeam
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with a list of Exchanges for team
 */
const listExchangesForTeam = async (payload, message) => {
  const filter = R.pick(FILTER_PROPERTIES, payload);
  const team = await teamRepo.findTeamById(payload.teamId);
  const exchanges = await exchangeRepo.findExchangesByTeam(
    team.id, message.credentials.id, filter);

  return exchanges;
};

/**
 * Lists exchanges for a user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the shift to fetch
 * @param {string} payload.start - start of the offset
 * @param {string} payload.end - end of the offset
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listPersonalizedExchanges
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with a list of Exchanges for a user
 */
const listPersonalizedExchanges = async (payload, message) => {
  const filter = R.pick(FILTER_PROPERTIES, payload);

  return exchangeRepo.findExchangesByUserAndNetwork(
    message.credentials.id, message.network.id, filter);
};

/**
 * Lists exchanges for a network of the current current user in the current network.
 * @param {object} payload - Object containing payload data
 * @param {object} payload.networkId - The network to list exchanges for
 * @param {string} payload.start - start of the offset
 * @param {string} payload.end - end of the offset
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listExchangesForUser
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 */
const listExchangesForUser = async (payload, message) => {
  logger.info('Listing all exchanges for user', { payload, message });

  const filter = R.pick(FILTER_PROPERTIES, payload);
  const user = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);

  let exchangeIds;

  if (user.roleType === 'ADMIN') {
    const exchanges = await exchangeRepo.findExchangesByNetwork(
      message.network.id, filter);
    exchangeIds = R.pluck('id', exchanges);
  } else if (user.roleType === 'EMPLOYEE') {
    exchangeIds = await impl.getExchangeIdsForEmployee(message.network, user, filter);
  }

  const createdExchangesByUser = await exchangeRepo.findAllBy(R.merge({
    userId: user.id, networkId: message.network.id,
  }, impl.createDateWhereConstraint(filter.start, filter.end)));

  return list({
    exchangeIds: R.concat(exchangeIds, R.pluck('id', createdExchangesByUser)) },
    message);
};

const createValidator = (exchangeType) => {
  if (exchangeType === exchangeTypes.TEAM) return teamRepo.validateTeamIds;
  if (exchangeType === exchangeTypes.USER) return userRepo.validateUserIds;
};

/**
 * Creates a new Exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.date - date for the exchange
 * @param {string} payload.values - {@link module:modules/flexchange~Exchange.values}
 * @param {string} payload.type - {@link module:modules/flexchange~Exchange.type}
 * @param {string} [payload.startTime] - {@link module:modules/flexchange~Exchange.startTime}
 * @param {string} [payload.endTime] - {@link module:modules/flexchange~Exchange.endTime}
 * @param {string} [payload.shiftId] - {@link module:modules/flexchange~Exchange.shiftId}
 * @param {string} [payload.title] - {@link module:modules/flexchange~Exchange.title}
 * @param {string} [payload.description]
 * {@link module:modules/flexchange~Exchange Exchange.description}
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method Dispatcher
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the newly created Exchange
 */
const createExchange = async (payload, message) => {
  logger.info('Creating an exchange', { payload, message });

  if (payload.startTime && payload.endTime && moment(payload.endTime).isBefore(payload.startTime)) {
    throw createError('422', 'Attribute end_time should be after start_time');
  }
  if (payload.shiftId && !message.network.hasIntegration) {
    throw createError('10001');
  }

  if (includes([exchangeTypes.TEAM, exchangeTypes.USER], payload.type)) {
    const validator = createValidator(payload.type);
    const isValid = validator ? await validator(payload.values, message.network.id) : true;

    if (!isValid) throw createError('422', 'Specified invalid ids for type.');
  }

  const createdExchange = await exchangeRepo.createExchange(
      message.credentials.id, message.network.id, R.merge(payload,
        { date: moment(payload.date).format('YYYY-MM-DD') }));

  if (createdExchange) {
    FlexchangeDispatcher.emit('exchange.created', {
      network: message.network,
      credentials: message.credentials,
      exchange: createdExchange,
    });
  }

  return exchangeRepo.findExchangeById(createdExchange.id);
};

/**
 * Lists activities on an exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - the exchange id to fetch the activities for
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listActivities
 * @return {external:Promise.<Activity[]>} {@link module:modules/shared~Activity Activity} -
 * Promise with a list of Exchanges for a user
 */
const listActivities = async (payload) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId);
  const values = await activityRepo.findActivitiesForSource(exchange);

  return sortBy(values, 'date');
};

/**
 * creates a comment for an exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - the exchange id to fetch the activities for
 * @param {string} payload.text - comment text
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createExchangeComment
 * @return {external:Promise.<ExchangeComment>}
 * {@link module:modules/flexchange~ExchangeComment Exchange} - Promise with a list of Exchanges
 * for a user
 */
const createExchangeComment = async (payload, message) => {
  const data = { text: payload.text, userId: message.credentials.id };
  const createdExchangeComment = await commentRepo.createExchangeComment(payload.exchangeId, data);

  const exchangeComment = await commentRepo.findCommentById(createdExchangeComment.id);

  // TODO activate notifications
  // commentNotifier.send(exchangeComment);

  return exchangeComment;
};

/**
 * Lists exchanges for current User.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - the exchange id to fetch the activities for
 * @param {string} payload.text - comment text
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listMyAcceptedExchanges
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with a list of Exchanges for a user
 */
const listMyAcceptedExchanges = async (payload, message) => {
  const responses = await exchangeResponseRepo.findAcceptedExchangeResponsesForUser(
    message.credentials.id);
  const exchanges = await exchangeRepo.findExchangeByIds(
    map(responses, 'exchangeId'), message.credentials.id);

  return exchanges;
};

// exports of functions
exports.acceptExchange = acceptExchange;
exports.approveExchange = approveExchange;
exports.createExchange = createExchange;
exports.createExchangeComment = createExchangeComment;
exports.declineExchange = declineExchange;
exports.deleteExchange = deleteExchange;
exports.getExchange = getExchange;
exports.getShift = getShift;
exports.list = list;
exports.listActivities = listActivities;
exports.listAvailableUsersForShift = listAvailableUsersForShift;
exports.listComments = listComments;
exports.listExchangesForTeam = listExchangesForTeam;
exports.listExchangesForUser = listExchangesForUser;
exports.listMyAcceptedExchanges = listMyAcceptedExchanges;
exports.listMyShifts = listMyShifts;
exports.listPersonalizedExchanges = listPersonalizedExchanges;
exports.listReceivers = listReceivers;
exports.listRespondedTo = listRespondedTo;
exports.rejectExchange = rejectExchange;
