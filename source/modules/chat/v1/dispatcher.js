import EventEmitter from '../../../shared/services/event-emitter';
import * as socketService from '../../../shared/services/socket';
import * as responseUtils from '../../../shared/utils/response';
import * as newMessageNotification from './notifications/new-message';

const pubsub = EventEmitter.create();

pubsub.asyncOn('message.created', (payload) => {
  const usersToNotify = payload.conversation.users.filter(
    user => user.id !== payload.message.createdBy.id);
  const socketPayload = { data: responseUtils.toSnakeCase(payload.message) };

  socketService.send('send-message', usersToNotify, socketPayload, payload.token);
  newMessageNotification.send(payload.message, usersToNotify);
});

export default pubsub;