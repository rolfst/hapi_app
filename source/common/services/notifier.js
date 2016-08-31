import Parse from 'parse/node';
import log from 'common/services/logger';

export const createEmailList = (users) => {
  return users.map(user => user.email).filter(u => u);
};

export const createQuery = (emails) => {
  const query = new Parse.Query(Parse.Installation);
  query.containedIn('loggedin_as_email', emails);

  return query;
};

export default (() => {
  const { PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY } = process.env;

  Parse.initialize(PARSE_APP_ID, PARSE_CLIENT_KEY, PARSE_MASTER_KEY);

  return {
    send(users, notification, networkId = null) {
      const data = {
        ...notification.data,
        alert: notification.text,
        sound: 'default',
        badge: 'Increment',
        network_id: networkId,
      };

      const emails = createEmailList(users);

      log.info('Sending push notification', { payload: data, email_list: emails });

      Parse.Push.send({ where: createQuery(emails), data })
        .catch(err => log.error('Error sending push notification', { stack: err.stack }));
    },
  };
})();
