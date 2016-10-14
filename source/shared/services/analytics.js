import Mixpanel from 'mixpanel';

export default (() => {
  const client = Mixpanel.init(process.env.MIXPANEL_TOKEN);
  let currentUser = null;

  return {
    setUser(user) {
      currentUser = user;
    },
    registerProfile(user) {
      if (process.env.API_ENV === 'testing') return false;

      const payload = {
        $first_name: user.firstName,
        $last_name: user.lastName,
        $email: user.email,
        $phone: user.phoneNum,
      };

      client.people.set(user.id, payload);
    },
    track(event) {
      if (process.env.API_ENV === 'testing') return false;
      if (!currentUser) throw new Error('No user set to track events.');

      const { name, data } = event;

      client.track(name, { ...data, distinct_id: currentUser.id });
    },
  };
})();
