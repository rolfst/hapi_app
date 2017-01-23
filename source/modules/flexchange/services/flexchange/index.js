import { sortBy, map, reject, includes } from 'lodash';
import R from 'ramda';
import moment from 'moment';
import * as Analytics from '../../../../shared/services/analytics';
import dispatchEvent, { EventTypes } from '../../../../shared/services/dispatch-event';
import * as Logger from '../../../../shared/services/logger';
import { createAdapter } from '../../../../shared/utils/create-adapter';
import approveExchangeEvent from '../../../../shared/events/approve-exchange-event';
import createError from '../../../../shared/utils/create-error';
import newExchangeEvent from '../../../../shared/events/new-exchange-event';
import * as teamRepo from '../../../core/repositories/team';
import * as userRepo from '../../../core/repositories/user';
import * as networkRepo from '../../../core/repositories/network';
import * as activityRepo from '../../../core/repositories/activity';
import * as userService from '../../../core/services/user';
import * as teamService from '../../../core/services/team';
import * as networkService from '../../../core/services/network';
import { exchangeTypes } from '../../repositories/dao/exchange';
import * as commentRepo from '../../repositories/comment';
import * as exchangeRepo from '../../repositories/exchange';
import * as exchangeValueRepo from '../../repositories/exchange-value';
import * as exchangeResponseRepo from '../../repositories/exchange-response';
import * as acceptanceNotifier from '../../notifications/accepted-exchange';
import * as creatorNotifier from '../../notifications/creator-approved';
import * as substituteNotifier from '../../notifications/substitute-approved';
import * as createdNotifier from '../../notifications/exchange-created';
import * as impl from './implementation';

/**
 * @module modules/flexchange/services/flexchange
 */
const logger = Logger.createLogger('FLEXCHANGE/service/exchange');

const isExpired = (date) => moment(date).diff(moment(), 'days') < 0;

const findUsersByType = async (type, networkId, exchangeValues, userId) => {
  let usersPromise;

  if (type === exchangeTypes.NETWORK) {
    usersPromise = networkRepo.findAllUsersForNetwork(networkId);
  } else if (type === exchangeTypes.TEAM) {
    usersPromise = teamRepo.findUsersByTeamIds(exchangeValues);
  }

  return reject(await usersPromise, u => u.id === userId);
};

/**
 * Lists exchanges for network by id
 * @param {object} payload - Object containing payload data
 * @param {string[]} payload.exchangeIds - The id of the exchanges to list
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method list
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange}
 */
export const list = async (payload, message) => {
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
export const listReceivers = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);
  const valueIds = map(exchange.ExchangeValues, 'value');
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

  return receivers;
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
export const acceptExchange = async (payload, message) => {
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

  return acceptedExchange;
};

/**
 * Approve an accepted exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to fetch the receivers for
 * @param {string} payload.user_id - The id of the user that has accepted the exchange
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method acceptExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the accepted exchange
 */
export const approveExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);

  const constraint = { exchangeId: payload.exchangeId, userId: payload.user_id };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (!exchangeResponse) {
    throw createError('403', 'You cannot approve a user that did not accept the exchange.');
  }

  impl.validateExchangeResponse(exchangeResponse);

  const approvedExchange = await exchangeRepo.approveExchange(exchange,
    message.credentials,
    payload.user_id);

  Promise.all([
    creatorNotifier.send(exchange),
    substituteNotifier.send(exchange),
  ]);

  Analytics.track(approveExchangeEvent(message.network, approvedExchange), message.credentials.id);
  dispatchEvent(
    EventTypes.EXCHANGE_APPROVED,
    message.credentials,
    { approvedUser: exchangeResponse.User }
  );

  return approvedExchange;
};

/**
 * Lists all exchanges who the user has responded to.
 * @param {object} payload - Object containing payload data
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method acceptExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the accepted exchange
 */
export const listRespondedTo = async (payload, message) => {
  const { network, credentials } = message;

  return exchangeRepo.getRespondedToExchange(credentials.id, network.id);
};

/**
 * Declines an exchange by a user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to decline
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method acceptExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the declined exchange
 */
export const declineExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw createError('403', 'You are already rejected for the exchange.');

  const declinedExchange = await exchangeRepo.declineExchange(exchange.id, message.credentials.id);

  return declinedExchange;
};

/**
 * Lists all shifts for user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to decline
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method acceptExchange
 * @return {external:Promise.<Shift[]>} {@link module:modules/flexchange~Shift Shift} -
 * Promise with list of shifts
 */
export const listMyShifts = async (payload, message) => {
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

export const deleteExchange = async (payload) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId);

  return exchangeRepo.deleteById(exchange.id);
};

/**
 * Rejects an acceptance response for the exchange.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.exchangeId - The id of the exchange to reject
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method acceptExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the rejected exchange
 */
export const rejectExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId,
    message.credentials.id);
  const constraint = { exchangeId: exchange.id, userId: payload.user_id };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  impl.validateExchangeResponse(exchangeResponse);

  const rejectedExchange = await exchangeRepo.rejectExchange(
    exchange, message.credentials, payload.user_id);
  const reloadedExchange = await rejectedExchange.reload();
  // TODO: Fire ExchangeWasRejected event

  return reloadedExchange;
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
export const getExchange = async (payload, message) => {
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
export const listComments = async (payload, message) => {
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
export const getShift = async (payload, message) => {
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
export const listAvailableUsersForShift = async (payload, message) => {
  if (!message.network.hasIntegration) throw createError('10001');

  const adapter = await createAdapter(message.network, message.credentials.id);
  const externalUsers = await adapter.usersAvailableForShift(payload.shiftId);
  const availableUsers = await impl.matchUsersForShift(externalUsers, message.network);

  return userService.listUsersWithNetworkScope({
    userIds: map(availableUsers, 'id'),
    networkId: message.network.id,
  }, message);
};

/**
 * Lists exchanges for a team.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.teamId - The id of the shift to fetch
 * @param {object} payload.filter - The filter attributes of the shift to fetch
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listExchangesForTeam
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with a list of Exchanges for team
 */
export const listExchangesForTeam = async (payload, message) => {
  const team = await teamRepo.findTeamById(payload.teamId);
  const exchanges = await exchangeRepo.findExchangesByTeam(
    team.id, message.credentials.id, payload.filter);

  return exchanges;
};

/**
 * Lists exchanges for a user.
 * @param {object} payload - Object containing payload data
 * @param {string} payload.userId - The id of the shift to fetch
 * @param {object} payload.filter - The filter attributes of the shift to fetch
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listPersonalizedExchanges
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with a list of Exchanges for a user
 */
export const listPersonalizedExchanges = async (payload, message) => {
  return exchangeRepo.findExchangesByUserAndNetwork(
    payload.userId, message.network.id, payload.filter);
};

/**
 * Lists exchanges for a network of the current current user in the current network.
 * @param {object} payload - Object containing payload data
 * @param {object} payload.networkId - The network to list exchanges for
 * @param {object} payload.filter - The filter
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method listExchangesForUser
 * @return {external:Promise.<Exchange[]>} {@link module:modules/flexchange~Exchange Exchange} -
 */
export const listExchangesForUser = async (payload, message) => {
  logger.info('Listing all exchanges for user', { payload, message });

  const user = await userService.getUserWithNetworkScope({
    id: message.credentials.id, networkId: message.network.id }, message);

  let exchanges;

  if (user.roleType === 'ADMIN') {
    exchanges = await exchangeRepo.findExchangesByNetwork(
      message.network.id, { ...payload.filter });
  } else if (user.roleType === 'EMPLOYEE') {
    exchanges = await impl.listExchangesForEmployee(message.network, user, payload.filter);
  }

  const createdExchangesByUser = await exchangeRepo.findAllBy(R.merge({
    userId: user.id, networkId: message.network.id,
  }, impl.createDateWhereConstraint(payload.filter.start, payload.filter.end)));

  return list({
    exchangeIds: R.pluck('id', R.concat(exchanges, createdExchangesByUser)) },
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
 * @param {string} payload.startTime - {@link module:modules/flexchange~Exchange Exchange.startTime}
 * @param {string} payload.endTime - {@link module:modules/flexchange~Exchange Exchange.endTime}
 * @param {string} payload.values - {@link module:modules/flexchange~Exchange Exchange.values}
 * @param {string} payload.type - {@link module:modules/flexchange~Exchange Exchange.type}
 * @param {string} [payload.shiftId] - {@link module:modules/flexchange~Exchange Exchange.shiftId}
 * @param {string} [payload.title] - {@link module:modules/flexchange~Exchange Exchange.title}
 * @param {string} [payload.description]
 * {@link module:modules/flexchange~Exchange Exchange.description}
 * @param {Message} message {@link module:shared~Message message} - Object containing meta data
 * @method createExchange
 * @return {external:Promise.<Exchange>} {@link module:modules/flexchange~Exchange Exchange} -
 * Promise with the newly created Exchange
 */
export const createExchange = async (payload, message) => {
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
    message.credentials.id, message.network.id, {
      ...payload,
      date: moment(payload.date).format('YYYY-MM-DD'),
    });

  const users = await findUsersByType(
    createdExchange.type, message.network.id, payload.values, message.credentials.id);

  await createdNotifier.send(users, createdExchange);

  Analytics.track(newExchangeEvent(message.network, createdExchange), message.credentials.id);
  dispatchEvent(EventTypes.EXCHANGE_CREATED, message.credentials, { exchange: createdExchange });

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
export const listActivities = async (payload) => {
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
export const createExchangeComment = async (payload, message) => {
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
export const listMyAcceptedExchanges = async (payload, message) => {
  const responses = await exchangeResponseRepo.findAcceptedExchangeResponsesForUser(
    message.credentials.id);
  const exchanges = await exchangeRepo.findExchangeByIds(
    map(responses, 'exchangeId'), message.credentials.id);

  return exchanges;
};
