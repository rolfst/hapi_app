import Parse from 'parse/node';

const sendPush = (users, text, extraData) => {
  if (process.env.NODE_ENV === 'testing') return false;

  const { PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY } = process.env;

  Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY);

  const emails = users.map(user => user.email);

  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails || []);

  return Parse.Push.send({
    where: query,
    data: Object.assign({
      alert: text,
      sound: 'default',
      badge: 'Increment',
      network_id: null,
    }, extraData),
  }).catch(err => console.log('Parse error:', err)); // eslint-disable-line
};

export default {
  sendPush,
  sendForMessage: (users, message, extraData) => {
    const notificationText = `${message.User.fullName}: ${message.text}`;

    return sendPush(users, notificationText, Object.assign({
      id: message.Conversation.id,
      type: 'conversation',
    }, extraData));
  },
};
