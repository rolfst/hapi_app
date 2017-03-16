const R = require('ramda');
const Mixpanel = require('mixpanel');
const EventEmitter = require('../../shared/services/event-emitter');
const Intercom = require('../../shared/services/intercom');
const networkService = require('../core/services/network');

const pubsub = EventEmitter.create();

function getClient() {
  return Mixpanel.init(process.env.MIXPANEL_TOKEN);
}

async function registerProfile(user) {
  if (!user.id) throw new Error('User need to have at least an identifier.');

  const networks = await networkService.listNetworksForUser(user.id);

  const payload = {
    $first_name: user.firstName,
    $last_name: user.lastName,
    $email: user.email,
    $networks: R.map((network) => network.id, networks),
  };

  getClient().people.set(user.id, payload);
}

pubsub.asyncOn('user.created', (payload) => {
  Intercom.getClient().users.create({
    user_id: payload.user.id,
    email: payload.user.email,
    name: payload.user.fullName,
    phone: payload.user.phoneNum || null,
    companies: [{ company_id: payload.network.id }],
    custom_attributes: { role: payload.user.roleType },
  });

  registerProfile(payload.user);
});

pubsub.asyncOn('user.updated', (payload) => {
  Intercom.getClient().users.update({
    email: payload.user.email,
    name: payload.user.fullName,
    phone: payload.user.phoneNum || null,
  });
});

pubsub.asyncOn('user.deleted', (payload) => {
  Intercom.getClient().users.update({
    email: payload.user.email,
    companies: [{ company_id: payload.network.id, remove: true }],
  });
});

export default pubsub;
