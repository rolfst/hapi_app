import Parse from 'parse/node';

const { PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY } = process.env;

export function createEmailList(users) {
  return users.map(user => user.email);
}

export default async function (users, notification, networkId = null) {
  Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY);

  const emails = createEmailList(users);

  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails || []);

  return Parse.Push.send({
    where: query,
    data: Object.assign({
      alert: notification.text,
      sound: 'default',
      badge: 'Increment',
      network_id: networkId,
    }, notification.data),
  }).catch(err => console.log('Parse error:', err));
}
