import { destructPayload } from 'services/payload';
import { Message, User, Conversation } from 'models';
import respondWithItem from 'utils/respondWithItem';
import conversationSerializer from 'serializers/conversation';

const values = ['type', 'users'];

module.exports = (req, reply) => {
  const payload = destructPayload(values, req.payload);
  payload.users.push(req.auth.credentials.user.id);

  User.findById(req.auth.credentials.user.id).then(user => {
    return user.hasConversationWith(User, payload);
  }).then(hasConversationWith => {
    console.log(hasConversationWith);
    reply('ok');
  }).catch(e => {
    reply(e);
  });

  // user.hasConversationWith(userId);

  /*
    if (existingChats.length) throw Boom.forbidden('You are already in a conversation with this person');

    return Conversation.create({
      type: payload.type.toUpperCase(),
      createdBy: req.auth.credentials.user.id,
    }).then(newConversation => {
      return [newConversation, newConversation.addUsers(payload.users)];
    }).spread(newConversation => {
      return Conversation.findById(newConversation.id, { include: [User, Message] });
    }).then(newConversation => {
      return reply(respondWithItem(newConversation, conversationSerializer, {
        relations: ['messages', 'users'],
      }));
    });
  }).catch(error => {
    reply(error);
  }); */
};
