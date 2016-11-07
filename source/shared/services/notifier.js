import Parse from 'parse/node';
import * as Logger from './logger';

const logger = Logger.getLogger('SHARED/services/notifier');

export const createEmailList = (users) => {
  return users.map(user => user.email).filter(u => u);
};

const createQuery = (emails) => {
  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails);

  return query;
};

const send = (users, notification, networkId = null, message = null) => {
  const data = {
    ...notification.data,
    alert: notification.text,
    sound: 'default',
    badge: 'Increment',
    network_id: networkId,
  };

  const emails = createEmailList(users);

  Parse.Push.send({ where: createQuery(emails), data })
    .catch(err => logger.warn('Error sending push notification', { message, err }));
};

export default { send };
