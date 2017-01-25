import EventEmitter from '../../shared/services/event-emitter';

const pubsub = new EventEmitter();

pubsub.asyncOn('exchange.create', function () {
  // Send message to Intercom
  // Send metrics to Mixpanel
  // Send Push Notifications
  console.log('Async');
});

export default pubsub;
