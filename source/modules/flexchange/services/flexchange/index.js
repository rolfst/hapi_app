import Boom from 'boom';
import { chain, orderBy } from 'lodash';
import moment from 'moment';
import createAdapter from '../../../../common/utils/create-adapter';
import analytics from '../../../../common/services/analytics';
import approveExchangeEvent from '../../../../common/events/approve-exchange-event';
import IntegrationNotFound from 'common/errors/integration-not-found';
import * as networkUtil from '../../../../common/utils/network';
import * as teamRepo from '../../../../common/repositories/team';
import { isAdmin, isEmployee } from 'common/services/permission';
import * as commentRepo from '../../repositories/comment';
import * as exchangeRepo from '../../repositories/exchange';
import * as exchangeResponseRepo from '../../repositories/exchange-response';
import * as activityRepo from '../../../../common/repositories/activity';
import * as notification from '../../notifications/accepted-exchange';
import * as creatorNotifier from '../../notifications/creator-approved';
import * as substituteNotifier from '../../notifications/substitute-approved';
import * as impl from './implementation';

// TODO activate notifications
// import * as commentNotifier from '../../notifications/new-exchange-comment';

const isExpired = (date) => moment(date).diff(moment(), 'days') < 0;

export const acceptExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);

  if (isExpired(exchange.date)) throw Boom.forbidden('Exchange has been expired.');
  if (exchange.approvedBy) throw Boom.badData('Exchange has already been approved.');

  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw Boom.badData('Your response is already rejected.');

  const acceptedExchange = await exchangeRepo.acceptExchange(exchange.id, message.credentials.id);
  notification.send(message.network, acceptedExchange, message.credentials);

  return acceptedExchange;
};


export const approveExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);

  const constraint = { exchangeId: payload.exchangeId, userId: payload.user_id };
  const exchangeResponse = await exchangeResponseRepo.findResponseWhere(constraint);

  if (exchangeResponse.approved) {
    throw Boom.badData('The user is already approved.');
  } else if (exchangeResponse.approved === 0) {
    throw Boom.badData('Cannot approve a rejected response.');
  } else if (!exchangeResponse.response) {
    throw Boom.badData('The user didn\'t accept the exchange.');
  }

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

export const declineExchange = async (payload, message) => {
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, message.credentials.id);
  const { ResponseStatus } = exchange;
  const approved = ResponseStatus ? ResponseStatus.approved : null;

  if (approved === 0) throw Boom.badData('Your response is already rejected.');

  const declinedExchange = await exchangeRepo.declineExchange(exchange.id, message.credentials.id);

  return declinedExchange;
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

  if (exchangeResponse.approved) {
    throw Boom.badData('The user is already approved.');
  }
  if (!exchangeResponse.response) {
    throw Boom.badData('The user didn\'t accept the exchange.');
  }

  const rejectedExchange = await exchangeRepo.rejectExchange(
    exchange, message.credentials, payload.user_id);
  const reloadedExchange = await rejectedExchange.reload();
  // TODO: Fire ExchangeWasRejected event

  return reloadedExchange;
};

export const listComments = async (payload, message) => {
  const userId = message.credentials.id;
  const exchange = await exchangeRepo.findExchangeById(payload.exchangeId, userId);

  return commentRepo.findCommentsByExchange(exchange);
};

export const getShift = async (payload, message) => {
  const { network, artifacts } = message;

  if (!networkUtil.hasIntegration(network)) throw IntegrationNotFound;

  const adapter = createAdapter(network, artifacts.integrations);
  const shift = await adapter.viewShift(payload.shiftId);

  if (!shift) throw Boom.notFound('Shift not found.');

  const [exchange] = await exchangeRepo.findExchangesByShiftIds([shift.id]);

  return impl.mergeShiftWithExchange(shift, exchange);
};

export const listAvailableUsersForShift = async (payload, message) => {
  const { network, artifacts } = message;

  if (!networkUtil.hasIntegration(network)) throw IntegrationNotFound;

  const externalUsers = await impl.findAvailableUsersForShift(
    payload.shiftId, network, artifacts);

  const availableUsers = await impl.matchUsersForShift(externalUsers, network);

  return availableUsers;
};

export const listExchangesForTeam = async (payload, message) => {
  const team = await teamRepo.findTeamById(payload.teamId);
  const exchanges = await exchangeRepo.findExchangesByTeam(
    team, message.credentials.id, payload.filter);

  return exchanges;
};

export const listExchangesForNetwork = async (payload, message) => {
  const { credentials, network } = message;
  let exchanges;

  if (isAdmin(credentials)) {
    exchanges = await exchangeRepo.findExchangesByNetwork(
      network, credentials.id, payload.filter);
  } else if (isEmployee(credentials)) {
    const teamIds = credentials.Teams
      .filter(t => t.networkId === network.id)
      .map(t => t.id);

    const exchangesInNetwork = await exchangeRepo.findExchangesForValues(
      'ALL', [network.id], credentials.id, payload.filter);

    const exchangesInTeams = await exchangeRepo.findExchangesForValues(
      'TEAM', teamIds, credentials.id, payload.filter);

    exchanges = [...exchangesInNetwork, ...exchangesInTeams];
  }
  const response = orderBy(exchanges, 'date');

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
