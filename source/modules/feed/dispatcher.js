import EventEmitter from '../../shared/services/event-emitter';
import * as notifier from '../../shared/services/notifier';
import * as messageImpl from './services/message/implementation';
import createdMessageNotification from './notifications/message-created';

const pubsub = EventEmitter.create();

/**
 * @param {object} payload - Object containing payload data
 * @param {User} payload.actor - The actor that initiated the event
 * @param {object} payload.parent - The parent where the message is created for
 * @param {Message} payload.message {@link module:feed~Message message} - The created message
 */
pubsub.asyncOn('message.created', async (payload) => {
  const notification = createdMessageNotification(payload.actor, payload.parent, payload.message);
  const parentUsers = await messageImpl.getUsersForParent(payload.parent.type, payload.parent.id);
  console.log('@@@@@parentUsers', parentUsers);
  notifier.send([], notification, payload.networkId);
});

export default pubsub;
