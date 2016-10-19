import { sortBy, orderBy, uniqBy, map, filter, includes } from 'lodash';
import moment from 'moment';
import createAdapter from '../../../../shared/utils/create-adapter';
import analytics from '../../../../shared/services/analytics';
import approveExchangeEvent from '../../../../shared/events/approve-exchange-event';
import createError from '../../../../shared/utils/create-error';
import { UserRoles } from '../../../../shared/services/permission';
import newExchangeEvent from '../../../../shared/events/new-exchange-event';
import * as teamRepo from '../../../core/repositories/team';
import * as userRepo from '../../../core/repositories/user';
import * as networkRepo from '../../../core/repositories/network';
import * as activityRepo from '../../../core/repositories/activity';
import * as userService from '../../../core/services/user';
import * as teamService from '../../../core/services/team';
import * as networkService from '../../../core/services/network';
import { exchangeTypes } from '../../models/exchange';
import * as commentRepo from '../../repositories/comment';
import * as exchangeRepo from '../../repositories/exchange';
import * as exchangeResponseRepo from '../../repositories/exchange-response';
import * as notification from '../../notifications/accepted-exchange';
import * as creatorNotifier from '../../notifications/creator-approved';
import * as substituteNotifier from '../../notifications/substitute-approved';
import * as createdByAdminNotifier from '../../notifications/exchange-created-by-admin';
import * as createdNotifier from '../../notifications/exchange-created';
import * as impl from './implementation';

const isExpired = (date) => moment(date).diff(moment(), 'days') < 0;
const findUsersByType = async (exchange, network, exchangeValues, loggedUser) => {
  let usersPromise;
  if (exchange.type === exchangeTypes.NETWORK) {
    usersPromise = networkRepo.findAllUsersForNetwork(network.id);
  } else if (exchange.type === exchangeTypes.TEAM) {
    usersPromise = teamRepo.findUsersByTeamIds(exchangeValues);
  }
  const users = await (usersPromise);
  return filter(users, u => u.id !== loggedUser.id);
};


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
    const userPayload = { userIds: valueIds };
    receivers = await userService.listUsersWithNetworkScope(userPayload, message);
  }

  return receivers;
};

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

  notification.send(message.network, acceptedExchange, acceptanceUser);

  return acceptedExchange;
};

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

  analytics.track(approveExchangeEvent(message.network, approvedExchange));

  return approvedExchange;
};

export const listRespondedTo = async (payload, message) => {
  const { network, credentials } = message;

  return exchangeRepo.getRespondedToExchange(credentials.id, network.id);
};

export const declineExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw createError('403', 'You are already rejected for the exchange.');

  const declinedExchange = await exchangeRepo.declineExchange(exchange.id, message.credentials.id);

  return declinedExchange;
};

export const listMyShifts = async (payload, message) => {
  const { network, artifacts } = message;

  if (!network.hasIntegration) throw createError('10001');

  const adapter = createAdapter(network, artifacts.integrations);
  const shifts = await adapter.myShifts();

  const [exchanges, teams] = await Promise.all([
    exchangeRepo.findExchangesByShiftIds(map(shifts, 'id')),
    teamRepo.findTeamsByExternalId(map(shifts, 'team_id')),
  ]);

  return impl.mapShiftsWithExchangeAndTeam(shifts, exchanges, teams);
};

export const deleteExchange = async (payload) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId);

  return exchangeRepo.deleteById(exchange.id);
};

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

export const getExchange = async (payload, message) => {
  const { credentials } = message;

  return exchangeRepo.findExchangeById(payload.exchangeId, credentials.id);
};

export const listComments = async (payload, message) => {
  const userId = message.credentials.id;
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, userId);

  return commentRepo.findCommentsByExchange(exchange);
};

export const getShift = async (payload, message) => {
  const { network, artifacts } = message;

  if (!network.hasIntegration) throw createError('10001');

  const adapter = createAdapter(network, artifacts.integrations);
  const shift = await adapter.viewShift(payload.shiftId);

  if (!shift) throw createError('404');

  const [exchanges, teams] = await Promise.all([
    exchangeRepo.findExchangesByShiftIds([shift.id]),
    teamRepo.findTeamsByExternalId([shift.team_id]),
  ]);

  return impl.mergeShiftWithExchangeAndTeam(shift, exchanges[0], teams[0]);
};

export const listAvailableUsersForShift = async (payload, message) => {
  const { network, artifacts } = message;

  if (!network.hasIntegration) throw createError('10001');

  const adapter = createAdapter(network, artifacts.integrations);
  const externalUsers = await adapter.usersAvailableForShift(payload.shiftId);
  const availableUsers = await impl.matchUsersForShift(externalUsers, network);

  return userService.listUsersWithNetworkScope({ userIds: map(availableUsers, 'id') }, message);
};

export const listExchangesForTeam = async (payload, message) => {
  const team = await teamRepo.findTeamById(payload.teamId);
  const exchanges = await exchangeRepo.findExchangesByTeam(
    team, message.credentials.id, payload.filter);

  return exchanges;
};

export const listPersonalizedExchanges = async (payload, message) => {
  return exchangeRepo.findExchangesByUserAndNetwork(
    payload.userId, message.network.id, payload.filter);
};

export const listExchangesForNetwork = async (payload, message) => {
  const { credentials, network } = message;
  const user = await userService.getUserWithNetworkScope({
    id: credentials.id, networkId: network.id }, message);

  const exchanges = await impl.listExchangesForUser(network, user, payload.filter);

  return orderBy(uniqBy(exchanges, 'id'), 'date');
};

const createNotifier = (roleType) => {
  if (roleType === UserRoles.EMPLOYEE) {
    return createdNotifier;
  } else if (roleType === UserRoles.ADMIN) {
    return createdByAdminNotifier;
  }
};

const createValidator = (exchangeType) => {
  if (exchangeType === exchangeTypes.TEAM) return teamRepo.validateTeamIds;
  if (exchangeType === exchangeTypes.USER) return userRepo.validateUserIds;
};

export const createExchange = async (payload, message) => {
  const { network, credentials } = message;
  if (payload.startTime && payload.endTime && moment(payload.endTime).isBefore(payload.startTime)) {
    throw createError('422', 'Attribute end_time should be after start_time');
  }

  if (payload.shiftId && !network.hasIntegration) {
    throw createError('10001');
  }

  if (includes([exchangeTypes.TEAM, exchangeTypes.USER], payload.type)) {
    const validator = createValidator(payload.type);
    const isValid = validator ? await validator(payload.values, network.id) : true;

    if (!isValid) throw createError('422', 'Specified invalid ids for type.');
  }
  const createdExchange = await exchangeRepo.createExchange(message.credentials.id, network.id, {
    ...payload,
    date: moment(payload.date).format('YYYY-MM-DD'),
  });

  const users = await findUsersByType(createdExchange, network, payload.values, credentials);

  const networkUser = await userRepo.findUserMetaDataForNetwork(credentials.id, network.id);
  const notifier = createNotifier(networkUser.roleType);
  notifier.send(users, createdExchange);
  analytics.track(newExchangeEvent(network, createdExchange));

  return exchangeRepo.findExchangeById(createdExchange.id);
};

export const listActivities = async (payload) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId);
  const values = await activityRepo.findActivitiesForSource(exchange);

  return sortBy(values, 'date');
};

export const getExchangeComment = async (payload, message) => {
  const data = { text: payload.text, userId: message.credentials.id };
  const createdExchangeComment = await commentRepo.createExchangeComment(payload.exchangeId, data);

  const exchangeComment = await commentRepo.findCommentById(createdExchangeComment.id);

  // TODO activate notifications
  // commentNotifier.send(exchangeComment);

  return exchangeComment;
};

export const listMyAcceptedExchanges = async (payload, message) => {
  const responses = await exchangeResponseRepo.findAcceptedExchangeResponsesForUser(
    message.credentials.id);
  const exchanges = await exchangeRepo.findExchangeByIds(
    map(responses, 'exchangeId'), message.credentials.id);

  return exchanges;
};
