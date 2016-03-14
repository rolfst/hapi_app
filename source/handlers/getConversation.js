import Conversation from 'models/Conversation';
import User from 'models/User';

module.exports = (req, reply) => {
  Conversation.find(
    {
      where: { id: req.params.id },
      include: [User],
    }
  ).then(conversation => {
    reply({ data: conversation });
  });
};
