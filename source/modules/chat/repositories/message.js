import Message from 'modules/chat/models/message';

export function findAllForConversation(conversation) {
    return conversation.getMessages();
}

export function createMessage(conversationId, creatorId, text) {
  return Message.create({
    parentId: conversationId,
    parentType: 'FlexAppeal\\Entities\\Conversation',
    text,
    createdBy: creatorId,
    messageType: 'default',
  });
}

export function findMessageById(id, includes) {
  return Message
    .findById(id, { include: includes })
    .then(message => {
      if (!message) return Boom.notFound('No message found.');

      return message;
    })
    .catch(err => Boom.badRequest(err));
}
