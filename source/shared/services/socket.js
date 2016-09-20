import fetch from 'isomorphic-fetch';

export const WEBSOCKET_URL = process.env.NODE_ENV === 'production' ? 'http://realtime.flex-appeal.nl' : 'http://test.realtime.flex-appeal.nl';

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
    });
  },
};
