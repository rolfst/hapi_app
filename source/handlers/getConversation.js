import { Conversation } from 'models';
import { Message } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id, {
    include: [{ model: Message, attributes: ['id'] }],
  }).then(conversation => {
    reply(respondWithItem(conversation, conversationSerializer, {
      relations: ['messages'],
    }));
  });
};
