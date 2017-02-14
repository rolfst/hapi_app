import EventEmitter from '../../shared/services/event-emitter';

const pubsub = EventEmitter.create();

pubsub.asyncOn('message.created', (payload) => {
  // Send push notification
});

export default pubsub;
