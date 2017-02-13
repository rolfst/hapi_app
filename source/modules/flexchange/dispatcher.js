import R from 'ramda';
import * as Analytics from '../../shared/services/analytics';
import EventEmitter from '../../shared/services/event-emitter';
import * as Intercom from '../../shared/services/intercom';
import approveExchangeEvent from '../../shared/events/approve-exchange-event';
import newExchangeEvent from '../../shared/events/new-exchange-event';
import * as creatorNotifier from './notifications/creator-approved';
import * as substituteNotifier from './notifications/substitute-approved';
import * as createdNotifier from './notifications/exchange-created';
import * as exchangeService from './services/flexchange';

const pubsub = EventEmitter.create();

pubsub.on('exchange.created', async (payload) => {
  const { exchange, network, exchangeValues, credentials } = payload;
  const intercomEventPayload = R.pick([
    'networkId', 'date', 'startTime', 'endTime', 'type'], exchange);
  const usersToNotify = await exchangeService.findUsersByType(
    exchange.type, network.id, exchangeValues, credentials.id);

  createdNotifier.send(usersToNotify, payload.exchange);
  Analytics.track(newExchangeEvent(network.id, exchange), credentials.id);
  Intercom.createEvent(credentials.username, 'exchange.create', intercomEventPayload);
  Intercom.incrementAttribute(credentials.username, 'created_shifts');
});

pubsub.asyncOn('exchange.approved', async (payload) => {
  const { exchange, network, credentials, approvedUser } = payload;

  creatorNotifier.send(exchange);
  substituteNotifier.send(exchange);
  Analytics.track(approveExchangeEvent(network, payload.exchange), credentials.id);
  Intercom.incrementAttribute(approvedUser.email, 'exchanged_shifts');
});

export default pubsub;
