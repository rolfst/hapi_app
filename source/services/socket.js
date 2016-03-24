import fetch from 'isomorphic-fetch';

export default {
  send: (eventName, userIds, payload, token) => {
    fetch(`http://realtime.flex-appeal.nl/${eventName}?token=${token}`, {
      method: 'POST',
      body: JSON.stringify({ payload, userIds }),
    });
  },
};
