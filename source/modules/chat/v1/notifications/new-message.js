const notifier = require('../../../../shared/services/notifier');

export const createNotification = (message) => {
  return {
    text: `${message.createdBy.fullName}: ${message.text}`,
    data: {
      id: message.conversation.id,
      type: 'conversation',
      track_name: 'private_message',
    },
  };
};

export const send = (message, usersToNotify) => {
  const notification = createNotification(message);

  notifier.send(usersToNotify, notification);
};
