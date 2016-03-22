import Boom from 'boom';
import { Conversation, Message } from 'models';
import respondWithItem from 'utils/respondWithItem';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id).then(conversation => {
    if (!conversation) throw Boom.notFound('No conversation found for id.');

    // const message = messageFactory.buildForConversation(conversation.id, req.payload.body);

    return Message.create({
      parentId: conversation.id,
      parentType: 'FlexAppeal\\Entities\\Conversation',
      text: req.payload.text,
      createdBy: req.auth.credentials.user.id,
      messageType: 'default',
    }).then(createdMessage => {
      return Message.findById(createdMessage.id);
    }).then(createdMessage => {
      return reply(respondWithItem(createdMessage, messageSerializer));
    });
  }).catch(error => {
    reply(error);
  });
};
