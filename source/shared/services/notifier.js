import Parse from 'parse/node';
import * as Logger from './logger';
import * as Analytics from './analytics';

const logger = Logger.getLogger('SHARED/services/notifier');

function createQuery(emails) {
  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails);

  return query;
}

export function createEmailList(users) {
  return users.map(user => user.email).filter(u => u);
}

export function trackPushNotification(notification, user) {
  return Analytics.track({ name: 'Push Notification Sent', data: notification.data }, user.id);
}

export function send(users, notification, networkId = null, message = null) {
  const data = {
    ...notification.data,
    alert: notification.text,
    sound: 'default',
    badge: 'Increment',
    network_id: networkId,
  };

  const emails = createEmailList(users);

  users.forEach(user => trackPushNotification(notification, user));

  return Parse.Push.send({ where: createQuery(emails), data })
    .catch(err => logger.warn('Error sending push notification', { message, err }));
}
