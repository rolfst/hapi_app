const R = require('ramda');
const Mixpanel = require('../../shared/services/mixpanel');
const EventEmitter = require('../../shared/services/event-emitter');
const Intercom = require('../../shared/services/intercom');
const objectService = require('../core/services/object');
const newExchangeEvent = require('./analytics/new-exchange-event');
const approveExchangeEvent = require('./analytics/approve-exchange-event');
const creatorNotifier = require('./notifications/creator-approved');
const substituteNotifier = require('./notifications/substitute-approved');
const createdNotifier = require('./notifications/exchange-created');
const exchangeService = require('./services/flexchange');

const pubsub = EventEmitter.create();

pubsub.asyncOn('exchange.created', async (payload) => {
  const { exchange, network, credentials } = payload;
  const intercomEventPayload = R.pick([
    'networkId', 'date', 'startTime', 'endTime', 'type'], exchange);
  const exchangeReceivers = await exchangeService.listReceivers({
    exchangeId: exchange.id,
  }, { credentials, network });

  const createObjectsForReceivers = R.map((receiver) => objectService.create({
    networkId: network.id,
    userId: exchange.userId,
    parentType: 'user',
    parentId: receiver.id,
    objectType: 'exchange',
    sourceId: exchange.id,
  }), exchangeReceivers);

  Promise.all(createObjectsForReceivers);

  createdNotifier.send(exchangeReceivers, payload.exchange);
  Mixpanel.track(newExchangeEvent(network.id, exchange), credentials.id);
  Intercom.createEvent(credentials.username, 'exchange.create', intercomEventPayload);
  Intercom.incrementAttribute(credentials.username, 'created_shifts');
});

pubsub.asyncOn('exchange.approved', (payload) => {
  const { exchange, network, credentials, approvedUser } = payload;

  objectService.remove({ objectType: 'exchange', sourceId: exchange.id });
  creatorNotifier.send(exchange);
  substituteNotifier.send(exchange);
  Mixpanel.track(approveExchangeEvent(network, payload.exchange), credentials.id);
  Intercom.incrementAttribute(approvedUser.email, 'exchanged_shifts');
});

module.exports = pubsub;
