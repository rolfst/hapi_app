const fetch = require('isomorphic-fetch');
const R = require('ramda');

const logger = require('./logger')('SHARED/services/socket');

const WEBSOCKET_URL = process.env.API_ENV === 'production' ?
  'https://realtime.flex-appeal.nl' : 'https://test.realtime.flex-appeal.nl';

const send = async (eventName, users, payload, token) => {
  const userIds = R.pluck('id', users);

  try {
    const response = await fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: JSON.stringify(payload), userIds }),
    });

    const jsonResponse = await response.json();

    if (response.ok) {
      logger.debug('Successfully send socket event', {
        userIds,
        eventName,
        payload,
        token,
        jsonResponse,
      });
    } else {
      logger.error('Error sending socket event', {
        userIds, eventName, payload, jsonResponse });
    }
  } catch (err) {
    logger.error('Error sending socket event', { err });
  }
};

exports.send = send;
exports.WEBSOCKET_URL = WEBSOCKET_URL;
