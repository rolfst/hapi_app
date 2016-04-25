import fetch from 'isomorphic-fetch';

export const WEBSOCKET_URL = process.env.REALTIME_BASE_URL;

export default {
  send: (eventName, users, payload, token) => {
    if (process.env.NODE_ENV === 'testing') return;

    const userIds = users.map(user => user.id);

    fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: JSON.stringify(payload), userIds }),
    }).catch(err => {
      console.log(err);
    });
  },
};
