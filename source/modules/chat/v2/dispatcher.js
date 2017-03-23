const R = require('ramda');
const EventEmitter = require('../../../shared/services/event-emitter');
const socketService = require('../../../shared/services/socket');
const Logger = require('../../../shared/services/logger');
const responseUtils = require('../../../shared/utils/response');
const userRepository = require('../../core/repositories/user');
const newMessageNotification = require('./notifications/new-message');

const pubsub = EventEmitter.create();
pubsub.setLogger(Logger.createLogger('CHAT/v1/dispatcher'));

pubsub.asyncOn('message.created', async (payload) => {
  const participants = await userRepository.findByIds(payload.conversation.participantIds);
  const usersToNotify = R.reject(R.propEq('id', payload.object.userId), participants);
  const actor = R.find(R.propEq('id', payload.object.userId), participants);
  const socketPayload = { data: responseUtils.toSnakeCase(payload.object) };

  socketService.send('private_message:created', usersToNotify, socketPayload, payload.token);

  newMessageNotification.send(actor, payload.object, usersToNotify);
});

module.exports = pubsub;
