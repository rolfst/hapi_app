import fetch from 'isomorphic-fetch';
import { map } from 'lodash';

export const WEBSOCKET_URL = process.env.API_ENV === 'production' ? 'http://188.226.130.15' : 'http://188.226.130.15';

export const send = (eventName, users, payload, token) => {
  if (process.env.API_ENV === 'testing') return;

  const userIds = map(users, 'id');

  fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payload: JSON.stringify(payload), userIds }),
  });
};
