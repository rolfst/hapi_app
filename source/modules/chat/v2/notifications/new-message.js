const notifier = require('../../../../shared/services/notifier');

const createNotification = (actor, object) => ({
  text: `${actor.fullName}: ${object.source.text}`,
  data: {
    id: object.parentId,
    type: 'conversation',
    track_name: 'private_message',
  },
});

const send = (actor, object, usersToNotify) => {
  const notification = createNotification(actor, object);

  notifier.send(usersToNotify, notification);
};

// exports of functions
exports.createNotification = createNotification;
exports.send = send;
