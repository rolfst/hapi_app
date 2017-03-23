const EventEmitter = require('../../../shared/services/event-emitter');
const socketService = require('../../../shared/services/socket');
const responseUtils = require('../../../shared/utils/response');
const newMessageNotification = require('./notifications/new-message');

const pubsub = EventEmitter.create();

pubsub.asyncOn('message.created', (payload) => {
  const usersToNotify = payload.conversation.users.filter(
    (user) => user.id !== payload.message.createdBy.id);
  const socketPayload = { data: responseUtils.toSnakeCase(payload.message) };

  socketService.send('send-message', usersToNotify, socketPayload, payload.token);
  newMessageNotification.send(payload.message, usersToNotify);
});

module.exports = pubsub;
