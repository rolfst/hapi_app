const fetch = require('isomorphic-fetch');
const R = require('ramda');
const Mixpanel = require('./mixpanel');

const logger = require('./logger')('SHARED/services/notifier');

function trackPushNotification(notification, user) {
  return Mixpanel.track({ name: 'Push Notification Sent', data: notification.data }, user.id);
}

async function send(users, notification, networkId = null, organisationId = null) {
  const emails = R.reject(R.isNil, R.pluck('email', users));
  const data = {
    app_id: process.env.ONESIGNAL_APP_ID,
    headings: notification.headings ? {
      en: notification.headings,
    } : null,
    contents: {
      en: notification.text,
    },
    android_group: 'flex_appeal_message',
    ios_badgeType: 'Increase',
    ios_badgeCount: 1,
    data: R.merge(notification.data, {
      organisation_id: organisationId,
      network_id: networkId,
    }),
    filters: R.intersperse({
      operator: 'OR',
    }, R.map(
      (email) => ({
        field: 'email',
        value: email,
      }),
      emails)
    ),
  };

  logger.debug('Sending Push Notification', { data, emails });

  const result = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    },
  });

  const json = await result.json();

  logger.debug('Response from Push Notification provider', { response: json });

  if (result.ok) {
    users.forEach((user) => trackPushNotification(notification, user));
  } else {
    logger.error('Error sending Push Notification', { response: json });
  }
}

exports.send = send;
exports.trackPushNotification = trackPushNotification;
