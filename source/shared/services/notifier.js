const fetch = require('isomorphic-fetch');
const R = require('ramda');
const Mixpanel = require('./mixpanel');

const logger = require('./logger')('SHARED/services/notifier');

function trackPushNotification(notification, user) {
  return Mixpanel.track({ name: 'Push Notification Sent', data: notification.data }, user.id);
}

const createEmailChunks = (users, emailsInChunk = 100) => R.pipe(
  R.pluck('email'),
  R.reject(R.isNil),
  R.splitEvery(emailsInChunk)
)(users);

const createData = R.curry((notification, { organisationId, networkId }, emailValues) => ({
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
    emailValues)
  ),
}));

const sendNotification = R.curry((notification, payload, emailValues) => {
  const data = createData(notification, payload, emailValues);

  logger.debug('Sending notification chunk to OneSignal', data);

  return fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${process.env.ONESIGNAL_API_KEY}`,
    },
  });
});

async function send(users, notification, networkId = null, organisationId = null) {
  logger.debug('Sending push notification', { users, notification, networkId, organisationId });

  const promises = R.pipe(
    createEmailChunks,
    R.map(sendNotification(notification, { organisationId, networkId }))
  )(users);

  const responses = await Promise.all(promises)
    .catch((err) => logger.error('Error while sending notification', err));

  if (!responses) return false;

  responses.forEach(async (result, i) => {
    if (result.ok) {
      logger.debug(`Succesfully send notifications to chunk ${i + 1}/${responses.length}`);
    } else {
      const json = await result.json();
      logger.error(`Error sending push notification to chunk ${i + 1}/${responses.length}`, { response: json });
    }
  });

  if (R.all(R.prop('ok'), responses)) {
    logger.debug('Succesfully send all notification chunks');
    users.forEach((user) => trackPushNotification(notification, user));
  }
}

exports.createEmailChunks = createEmailChunks;
exports.createData = createData;
exports.sendNotification = sendNotification;
exports.send = send;
exports.trackPushNotification = trackPushNotification;
