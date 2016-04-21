import Message from 'modules/chat/models/Message';

export default {
  buildForConversation: (parentId, creatorId, text) => {
    const model = Message.build({
      parentId,
      parentType: 'FlexAppeal\\Entities\\Conversation',
      text,
      createdBy: creatorId,
      messageType: 'default',
    });

    return model;
  },
};
