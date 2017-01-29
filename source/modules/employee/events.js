import EventEmitter from '../../shared/services/event-emitter';
// import * as Analytics from '../../shared/services/analytics';
import * as Intercom from '../../shared/services/intercom';

const pubsub = new EventEmitter();

pubsub.asyncOn('user.created', (payload) => {
  Intercom.getClient().users.create({
    user_id: payload.user.id,
    email: payload.user.email,
    name: payload.user.fullName,
    phone: payload.user.phoneNum || null,
    companies: [{ company_id: payload.network.id }],
    custom_attributes: { role: payload.user.roleType },
  });
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
