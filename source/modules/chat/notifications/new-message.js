import notifier from '../../../shared/services/notifier';

export const createNotification = (message) => {
  return {
    text: `${message.createdBy.fullName}: ${message.text}`,
    data: {
      id: message.conversation.id,
      type: 'conversation',
    },
  };
};

export const send = (message, usersToNotify) => {
  const notification = createNotification(message);

  notifier.send(usersToNotify, notification);
};
