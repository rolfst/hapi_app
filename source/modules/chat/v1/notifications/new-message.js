const notifier = require('../../../../shared/services/notifier');

const createNotification = (message) => {
  return {
    text: `${message.createdBy.fullName}: ${message.text}`,
    data: {
      id: message.conversation.id,
      type: 'conversation',
      track_name: 'private_message',
    },
  };
};

const send = (message, usersToNotify) => {
  const notification = createNotification(message);

  notifier.send(usersToNotify, notification);
};

exports.createNotification = createNotification;
exports.send = send;
