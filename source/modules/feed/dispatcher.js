import R from 'ramda';
import EventEmitter from '../../shared/services/event-emitter';
import * as notifier from '../../shared/services/notifier';
import * as objectService from './services/object';
import createdMessageNotification from './notifications/message-created';

const pubsub = EventEmitter.create();

/**
 * @param {object} payload - Object containing payload data
 * @param {User} payload.actor - The actor that initiated the event
 * @param {object} payload.parent - The parent where the message is created for
 * @param {Object} payload.object {@link module:feed~Object object} - The created object
 */
pubsub.asyncOn('message.created', async (payload) => {
  const notification = createdMessageNotification(payload.actor, payload.parent, payload.object);
  const usersToNotify = await objectService
    .usersForParent({ parentType: payload.parent.type, parentId: payload.parent.id })
    .then(R.reject(R.propEq('id', payload.actor.id)))
    .catch(() => Promise.resolve([]));

  notifier.send(usersToNotify, notification, payload.networkId);
});

export default pubsub;
