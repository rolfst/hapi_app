import Boom from 'boom';
import { Conversation } from 'modules/chat/models';

module.exports = (req, reply) => {
  Conversation.findById(req.params.id).then(conversation => {
    return conversation.destroy();
  }).then(() => {
    reply({ message: 'Successfully deleted conversation' });
  }).catch(err => {
    reply(Boom.badRequest(err));
  });
};
