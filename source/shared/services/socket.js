import fetch from 'isomorphic-fetch';
import R from 'ramda';
import * as Logger from './logger';

const logger = Logger.createLogger('SHARED/services/socket');

export const WEBSOCKET_URL = process.env.API_ENV === 'production' ?
  'https://realtime.flex-appeal.nl' : 'https://test.realtime.flex-appeal.nl';

export const send = (eventName, users, payload, token) => {
  if (process.env.API_ENV === 'testing') return;

  const userIds = R.pluck('id', users);
  logger.info('Sending socket event', { userIds, eventName, payload });

  fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payload: JSON.stringify(payload), userIds }),
  });
};
