import R from 'ramda';
import EventEmitter from '../../shared/services/event-emitter';
import * as Notifier from '../../shared/services/notifier';
import * as Mixpanel from '../../shared/services/mixpanel';
import * as objectService from '../core/services/object';
import * as networkService from '../core/services/network';
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

  const networkP = networkService.get({ networkId: payload.networkId }, {});
  const usersToNotifyP = objectService
    .usersForParent({ parentType: payload.parent.type, parentId: payload.parent.id })
    .then(R.reject(R.propEq('id', payload.actor.id)))
    .catch(() => Promise.resolve([]));
  
  const [network, usersToNotify] = await Promise.all([networkP, usersToNotifyP]);

  Notifier.send(usersToNotify, notification, payload.networkId);
  Mixpanel.track({
    name: 'Created Message',
    data: {
      'Network Id': network.networkId,
      'Network Name': network.name,
      'Placed In': payload.parent.type === 'team' ? 'Team' : 'Network',
    },
  }, payload.credentials.id);
});

export default pubsub;
