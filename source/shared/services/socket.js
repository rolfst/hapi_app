import fetch from 'isomorphic-fetch';
import R from 'ramda';
import * as Logger from './logger';

const logger = Logger.createLogger('SHARED/services/socket');

export const WEBSOCKET_URL = process.env.API_ENV === 'production' ?
  'https://realtime.flex-appeal.nl' : 'https://test.realtime.flex-appeal.nl';

export const send = async (eventName, users, payload, token) => {
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
      logger.info('Successfully send socket event', {
        userIds, eventName, payload, token, jsonResponse });
    } else {
      logger.error('Error sending socket event', {
        userIds, eventName, payload, jsonResponse });
    }
  } catch (err) {
    logger.error('Error sending socket event', { err });
  }
};
