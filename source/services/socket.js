import fetch from 'isomorphic-fetch';

export default {
  send: (eventName, payload, token) => {
    fetch(`http://localhost:3000/${eventName}?token=${token}`, {
      method: 'POST',
      body: JSON.stringify({ payload }),
    });
  },
};
