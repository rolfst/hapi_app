import Conversation from 'models/Conversation';
import ConversationUser from 'models/ConversationUser';
import User from 'models/User';

module.exports = (req, reply) => {
  Conversation.find({ where: { id: req.params.id }, include: [User] }).then(conversation => {
    reply(JSON.stringify({ data: conversation }));
  });
};
