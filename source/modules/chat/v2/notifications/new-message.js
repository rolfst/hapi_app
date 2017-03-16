const notifier = require('../../../../shared/services/notifier');

export const createNotification = (actor, object) => ({
  text: `${actor.fullName}: ${object.source.text}`,
  data: {
    id: object.parentId,
    type: 'conversation',
    track_name: 'private_message',
  },
});

export const send = (actor, object, usersToNotify) => {
  const notification = createNotification(actor, object);

  notifier.send(usersToNotify, notification);
};
