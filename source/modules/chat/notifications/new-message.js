import notifier from '../../../shared/services/notifier';

export const createNotification = (message) => {
  return {
    text: `${message.User.fullName}: ${message.text}`,
    data: {
      id: message.Conversation.id,
      type: 'conversation',
    },
  };
};

export const send = (message, usersToNotify) => {
  const notification = createNotification(message);

  notifier.send(usersToNotify, notification);
};
