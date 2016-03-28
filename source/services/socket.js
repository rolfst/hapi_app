import fetch from 'isomorphic-fetch';

export const WEBSOCKET_URL = process.env.NODE_ENV === 'development' ?
  'http://localhost:2222' : 'http://realtime.flex-appeal.nl';

export default {
  send: (eventName, userIds, payload, token) => {
    const payloadJson = JSON.stringify(payload);

    fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: payloadJson, userIds }),
    });
  },
};
