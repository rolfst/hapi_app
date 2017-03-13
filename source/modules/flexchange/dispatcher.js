import R from 'ramda';
import * as mixpanel from '../../shared/services/mixpanel';
import EventEmitter from '../../shared/services/event-emitter';
import * as Intercom from '../../shared/services/intercom';
import * as objectService from '../core/services/object';
import newExchangeEvent from './analytics/new-exchange-event';
import approveExchangeEvent from './analytics/approve-exchange-event';
import * as creatorNotifier from './notifications/creator-approved';
import * as substituteNotifier from './notifications/substitute-approved';
import * as createdNotifier from './notifications/exchange-created';
import * as exchangeService from './services/flexchange';

const pubsub = EventEmitter.create();

pubsub.asyncOn('exchange.created', async (payload) => {
  const { exchange, network, credentials } = payload;
  const intercomEventPayload = R.pick([
    'networkId', 'date', 'startTime', 'endTime', 'type'], exchange);
  const exchangeReceivers = await exchangeService.listReceivers({
    exchangeId: exchange.id,
  }, { credentials, network });

  const createObjectsForReceivers = R.map((receiver) => objectService.create({
    userId: exchange.userId,
    parentType: 'user',
    parentId: receiver.id,
    objectType: 'exchange',
    sourceId: exchange.id,
  }), exchangeReceivers);

  Promise.all(createObjectsForReceivers);

  createdNotifier.send(exchangeReceivers, payload.exchange);
  mixpanel.track(newExchangeEvent(network.id, exchange), credentials.id);
  Intercom.createEvent(credentials.username, 'exchange.create', intercomEventPayload);
  Intercom.incrementAttribute(credentials.username, 'created_shifts');
});

pubsub.asyncOn('exchange.approved', (payload) => {
  const { exchange, network, credentials, approvedUser } = payload;

  objectService.remove({ objectType: 'exchange', sourceId: exchange.id });
  creatorNotifier.send(exchange);
  substituteNotifier.send(exchange);
  mixpanel.track(approveExchangeEvent(network, payload.exchange), credentials.id);
  Intercom.incrementAttribute(approvedUser.email, 'exchanged_shifts');
});

export default pubsub;
