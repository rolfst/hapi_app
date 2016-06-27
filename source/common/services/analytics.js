import Mixpanel from 'mixpanel';

export default (() => {
  let client = null;
  let currentUser = null;

  return {
    init() {
      if (client === null) {
        client = Mixpanel.init(process.env.MIXPANEL_TOKEN, { debug: true });
      }
    },
    setUser(user) {
      currentUser = user;
    },
    registerProfile(user) {
      client.people.set(user.id, {
        $first_name: user.firstName,
        $last_name: user.lastName,
        $email: user.email,
        $phone: user.phoneNum,
      });
    },
    track(event) {
      if (process.env.NODE_ENV === 'testing') return false;

      if (!currentUser) throw new Error('No user set to track events.');

      return client.track(event.name, { ...event.data, distinct_id: currentUser.id });
    },
  };
})();
