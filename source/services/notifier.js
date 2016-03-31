import Parse from 'parse/node';
import moment from 'moment';

const sendPush = (emails, message, extraData) => {
  const { PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY } = process.env;

  Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY);

  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails || []);

  return Parse.Push.send({
    where: query,
    push_time: moment().add(1, 'minutes').toISOString(),
    data: Object.assign({
      alert: message,
      sound: 'default',
      badge: 'Increment',
      network_id: null,
    }, extraData),
  }).catch(err => console.log('Parse error:', err));
};

export default {
  sendPush,
  sendForMessage: (messageId, conversationId, emails, message, extraData) => {
    return sendPush(emails, message, Object.assign({
      id: messageId,
      conversation_id: conversationId,
      type: 'message',
    }, extraData));
  },
};
