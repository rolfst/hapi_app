import R from 'ramda';
import EventEmitter from '../../../shared/services/event-emitter';
import * as socketService from '../../../shared/services/socket';
import * as responseUtils from '../../../shared/utils/response';
import * as userRepository from '../../core/repositories/user';
import * as newMessageNotification from './notifications/new-message';

const pubsub = EventEmitter.create();

pubsub.on('message.created', async (payload) => {
  const participants = await userRepository.findByIds(payload.conversation.participantIds);
  const usersToNotify = R.reject(R.propEq('id', payload.object.userId), participants);
  const actor = R.find(R.propEq('id', payload.object.userId), participants);
  const socketPayload = { data: responseUtils.toSnakeCase(payload.object) };

  socketService.send('private_message:created', usersToNotify, socketPayload, payload.token);
  newMessageNotification.send(actor, payload.object, usersToNotify);
});

export default pubsub;
