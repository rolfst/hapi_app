import { chain, map } from 'lodash';
import moment from 'moment';
import createAdapter from '../../../../common/utils/create-adapter';
import analytics from '../../../../common/services/analytics';
import approveExchangeEvent from '../../../../common/events/approve-exchange-event';
import createError from '../../../../common/utils/create-error';
import * as networkUtil from '../../../../common/utils/network';
import * as teamRepo from '../../../../common/repositories/team';
import * as activityRepo from '../../../../common/repositories/activity';
import * as commentRepo from '../../repositories/comment';
import * as exchangeRepo from '../../repositories/exchange';
import * as exchangeResponseRepo from '../../repositories/exchange-response';
import * as notification from '../../notifications/accepted-exchange';
import * as creatorNotifier from '../../notifications/creator-approved';
import * as substituteNotifier from '../../notifications/substitute-approved';
import * as impl from './implementation';

// TODO activate notifications
// import * as commentNotifier from '../../notifications/new-exchange-comment';

const isExpired = (date) => moment(date).diff(moment(), 'days') < 0;

export const acceptExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);

  if (isExpired(exchange.date)) throw createError('403', 'The exchange is expired.');
  if (exchange.approvedBy) throw createError('403', 'The exchange is already approved.');

  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw createError('403', 'You are already rejected for the exchange.');

  const acceptedExchange = await exchangeRepo.acceptExchange(exchange.id, message.credentials.id);
  notification.send(message.network, acceptedExchange, message.credentials);

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

  if (!networkUtil.hasIntegration(network)) throw createError('10001');

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

  return exchangeRepo.deleteExchangeById(exchange.id);
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

  if (!networkUtil.hasIntegration(network)) throw createError('10001');

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

  if (!networkUtil.hasIntegration(network)) throw createError('10001');

  const adapter = createAdapter(network, artifacts.integrations);
  const externalUsers = await adapter.usersAvailableForShift(payload.shiftId);

  const availableUsers = await impl.matchUsersForShift(externalUsers, network);

  return availableUsers;
};

export const listExchangesForTeam = async (payload, message) => {
  const team = await teamRepo.findTeamById(payload.teamId);
  const exchanges = await exchangeRepo.findExchangesByTeam(
    team, message.credentials.id, payload.filter);

  return exchanges;
};

export const listExchangesForUser = async (payload, message) => {
  return exchangeRepo.findExchangesByUserAndNetwork(
    message.credentials, message.network.id, payload.filter);
};

export const listExchangesForNetwork = async (payload, message) => {
  const { credentials, network } = message;

  const exchanges = await impl.findExchangesForUser(network, credentials, payload.filter);

  const response = chain(exchanges)
    .orderBy('date')
    .uniqBy('id')
    .value();

  return response;
};

export const listActivities = async (payload) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId);
  const values = await activityRepo.findActivitiesForSource(exchange);

  return chain(values).sortBy('date').value();
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
  const exchanges = await exchangeRepo.findExchangeByIds(responses.map(r => r.exchangeId));

  return exchanges;
};
