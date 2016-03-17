import { Conversation, Message } from 'models';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id).then(conversation => {
    if (!conversation) reply('Not found.');

    // const message = messageFactory.buildForConversation(conversation.id, req.payload.body);

    return Message.create({
      parentId: conversation.id,
      parentType: 'FlexAppeal\\Entities\\Conversation',
      text: req.payload.body,
      createdBy: 2,
      messageType: 'default',
    });
  }).then(createdMessage => reply({ data: createdMessage }));
};
