const R = require('ramda');
const Mixpanel = require('../../shared/services/mixpanel');
const EventEmitter = require('../../shared/services/event-emitter');
const Intercom = require('../../shared/services/intercom');
const objectService = require('../core/services/object');
const newExchangeEvent = require('./analytics/new-exchange-event');
const approveExchangeEvent = require('./analytics/approve-exchange-event');
const acceptanceNotifier = require('./notifications/accepted-exchange');
const creatorNotifier = require('./notifications/creator-approved');
const substituteNotifier = require('./notifications/substitute-approved');
const createdNotifier = require('./notifications/exchange-created');
const commentNotifier = require('./notifications/new-exchange-comment');
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

  createdNotifier.send(exchangeReceivers, payload.exchange, network);
  Mixpanel.track(newExchangeEvent(network, exchange), credentials.id);
  Intercom.createEvent(credentials.username, 'exchange.create', intercomEventPayload);
  Intercom.incrementAttribute(credentials.username, 'created_shifts');
});

pubsub.asyncOn('exchange.approved', async (payload) => {
  const { exchange, network, approvedUser } = payload;

  objectService.remove({ objectType: 'exchange', sourceId: exchange.id });
  creatorNotifier.send(exchange, network);
  substituteNotifier.send(exchange, network);
  Mixpanel.track(approveExchangeEvent(network, payload.exchange), approvedUser.id);
  Intercom.incrementAttribute(approvedUser.email, 'exchanged_shifts');
});

pubsub.asyncOn('exchange.accepted', async (payload) => {
  const { acceptedExchange, acceptanceUser, network } = payload;

  acceptanceNotifier.send(network, acceptedExchange, acceptanceUser);

  objectService.remove({
    parentType: 'user',
    parentId: acceptanceUser.id,
    objectType: 'exchange',
    sourceId: acceptedExchange.id,
  });
});

pubsub.asyncOn('exchange.comment', async (payload) => {
  commentNotifier.send(exchangeComment);
});

module.exports = pubsub;
