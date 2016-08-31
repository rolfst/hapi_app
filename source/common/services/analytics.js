import Mixpanel from 'mixpanel';
import log from 'common/services/logger';

export default (() => {
  let client = null;
  let currentUser = null;

  return {
    init() {
      if (client === null) {
        client = Mixpanel.init(process.env.MIXPANEL_TOKEN);
      }
    },
    setUser(user) {
      currentUser = user;
    },
    registerProfile(user) {
      if (process.env.NODE_ENV === 'testing') return false;
      if (!client) throw new Error('No Mixpanel client initialized.');

      const payload = {
        $first_name: user.firstName,
        $last_name: user.lastName,
        $email: user.email,
        $phone: user.phoneNum,
      };

      log.info('Sending the following data to Mixpanel', { ...payload });
      client.people.set(user.id, payload);
    },
    track(event) {
      if (process.env.NODE_ENV === 'testing') return false;
      if (!client) throw new Error('No Mixpanel client initialized.');
      if (!currentUser) throw new Error('No user set to track events.');

      const { name, data } = event;

      log.info('Sending the following data to Mixpanel', { ...data, event_name: name });
      client.track(name, { ...data, distinct_id: currentUser.id });
    },
  };
})();
