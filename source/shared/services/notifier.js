const Parse = require('parse/node');
const R = require('ramda');
const Logger = require('./logger');
const Mixpanel = require('./mixpanel');

const logger = Logger.createLogger('SHARED/services/notifier');

function createQuery(emails) {
  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails);

  return query;
}

function trackPushNotification(notification, user) {
  return Mixpanel.track({ name: 'Push Notification Sent', data: notification.data }, user.id);
}

function send(users, notification, networkId = null) {
  const data = R.merge(notification.data,
    {
      alert: notification.text,
      sound: 'default',
      badge: 'Increment',
      network_id: networkId,
    });

  const emails = R.reject(R.isNil, R.pluck('email', users));

  logger.info('Sending Push Notification', { data, emails });

  return Parse.Push.send({ where: createQuery(emails), data }, { useMasterKey: true })
    .then(() => users.forEach(user => trackPushNotification(notification, user)))
    .catch(err => logger.error('Error sending push notification', { err }));
}

// exports of functions
exports.send = send;
exports.trackPushNotification = trackPushNotification;
