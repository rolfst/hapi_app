import Message from 'models/Message';

export default {
  buildForConversation: (parentId, creatorId, text) => {
    const model = Message.build({
      parentId: parentId,
      parentType: 'FlexAppeal\\Entities\\Conversation',
      text,
      createdBy: creatorId,
      messageType: 'default',
    });

    return model;
  },
};
