import fetch from 'isomorphic-fetch';
import log from 'common/services/logger';

export const WEBSOCKET_URL = process.env.NODE_ENV === 'production' ? 'http://realtime.flex-appeal.nl' : 'http://test.realtime.flex-appeal.nl';

export default {
  send: (eventName, users, payload, token) => {
    if (process.env.NODE_ENV === 'testing') return;

    const userIds = users.map(user => user.id);
    log.info('Sending socket event', { event_name: eventName, payload, user_ids: userIds });

    fetch(`${WEBSOCKET_URL}/${eventName}?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload: JSON.stringify(payload), userIds }),
    });
  },
};
