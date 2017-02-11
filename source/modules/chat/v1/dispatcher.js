import EventEmitter from '../../../shared/services/event-emitter';
import * as socketService from '../../../shared/services/socket';
import * as responseUtils from '../../../shared/utils/response';
import * as newMessageNotification from './notifications/new-message';

const pubsub = EventEmitter.create();

pubsub.on('message.created', async (payload) => {
  const usersToNotify = payload.conversation.users.filter(
    user => user.id !== payload.message.createdBy.id);

  newMessageNotification.send(payload.message, usersToNotify);

  const socketPayload = { data: responseUtils.toSnakeCase(payload.message) };
  socketService.send('send-message', usersToNotify, socketPayload, payload.token);
});

export default pubsub;
