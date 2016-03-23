import Boom from 'boom';
import fetch from 'isomorphic-fetch';
import { Conversation, Message } from 'models';
import messageFactory from 'factories/message';
import notifier from 'services/notifier';
import socket from 'services/socket';
import respondWithItem from 'utils/respondWithItem';
import messageSerializer from 'serializers/message';

module.exports = (req, reply) => {
  const Parse = notifier;

  // $payload = [
  //           'where' => [
  //               'loggedin_as_email' => [
  //                   '$in' => $users->lists('email')
  //               ]
  //           ],
  //           'push_time' => Carbon::now()->addMinute()->timestamp,
  //           'data' => [
  //               'alert' => $text,
  //               'sound' => 'default',
  //               'badge' => 'Increment',
  //               'id' => $this->notification->getModel()->id,
  //               'type' => $this->notification->getType()
  //           ],
  //       ];
  const query = Parse.Query.containedIn('loggedin_as_email', ['ruben@flex-appeal.nl']);
  console.log(query);
  Parse.Push.send({
    where: query,
    push_time: moment().add(1, 'minutes').toISOString(),
    data: {
      alert: 'Test vanaf NodeJS',
      sound: 'default',
      badge: 'Increment',
    },
  }).then(function(object) {
    console.log('success', object);
  }).catch(err => console.error(err));
  // Conversation.findById(req.params.id)
  //   .then(conversation => {
  //     if (!conversation) throw Boom.notFound('No conversation found for id.');
  //
  //     return messageFactory
  //       .buildForConversation(conversation.id, req.auth.credentials.user.id, req.payload.text)
  //       .save();
  //   })
  //   .then(createdMessage => Message.findById(createdMessage.id))
  //   .then(message => {
  //     const response = respondWithItem(message, messageSerializer);
  //     socket.send('send-message', response, req.headers['x-api-token']);
  //
  //     return reply(response);
  //   }).catch(error => {
  //     console.error(error);
  //     reply(error);
  //   });
};
