import Conversation from 'models/Conversation';
import Message from 'models/Message';

module.exports = (req, reply) => {
  console.log(req.payload);
  reply('ok');
};
