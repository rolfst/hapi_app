import fetch from 'isomorphic-fetch';

export const WEBSOCKET_URL = process.env.NODE_ENV === 'development' ?
  'http://localhost:3000' : 'http://realtime.flex-appeal.nl';

export default {
  send: (eventName, userIds, payload, token) => {
    fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
      method: 'POST',
      body: JSON.stringify({ payload, userIds }),
    });
  },
};
