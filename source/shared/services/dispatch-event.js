import R from 'ramda';
import moment from 'moment';
import * as Intercom from 'intercom-client';

export const EventTypes = {
  NETWORK_CREATED: 'network-created', // TODO
  NETWORK_UPDATED: 'network-updated', // TODO
  USER_INVITED: 'user-invited',
  USER_UPDATED: 'user-updated', // TODO only /users/me is on node-api
  USER_UPDATED_ROLE: 'user-updated-role', // TODO
  USER_REMOVED: 'user-removed', // TODO
  EXCHANGE_CREATED: 'exchange-created',
  EXCHANGE_APPROVED: 'exchange-approved',
  MESSAGE_CREATED: 'message-created', // TODO
};

const eventEq = R.pipe(R.nthArg(0), R.equals);
const intercomListener = (client) => {
  const incrementAttribute = (email, attributeName) => {
    const updatingUser = client.users.find({ email });

    return client.users.update({ email, custom_attributes: {
      [attributeName]: updatingUser[attributeName] + 1,
    } });
  };

  const createEvent = (email, eventName, meta) => client.events.create({
    email,
    event_name: eventName,
    created_at: moment().unix(),
    metadata: meta,
  });

  return R.cond([
    [eventEq(EventTypes.USER_INVITED), (eventName, payload) => client.users.create({
      user_id: payload.id,
      email: payload.email,
      name: payload.fullName,
      phone: payload.phoneNum || null,
      companies: [{ company_id: payload.networkId }],
      custom_attributes: { role: payload.roleType },
    })],
    [eventEq(EventTypes.USER_UPDATED), (eventName, payload) => client.users.update({
      email: payload.email,
      name: payload.fullName,
      phone: payload.phoneNum || null,
    })],
    [eventEq(EventTypes.USER_REMOVED), (eventName, payload) => client.users.update({
      email: payload.email,
      companies: [{ company_id: payload.networkId, remove: true }],
    })],
    [eventEq(EventTypes.EXCHANGE_CREATED), (eventName, payload) => {
      createEvent(payload.email, eventName,
        R.pick(['networkId', 'date', 'startTime', 'endTime', 'type'], payload.exchange));

      incrementAttribute(payload.email, 'created_shifts');
    }],
    [eventEq(EventTypes.EXCHANGE_APPROVED), (eventName, payload) =>
      incrementAttribute(payload.approvedUser.email, 'exchanged_shifts')],
  ]);
};

const defaultListeners = [
  intercomListener(new Intercom.Client({ token: process.env.INTERCOM_TOKEN })),
];

export const dispatchEvent = (eventName, payload, listeners = defaultListeners) => {
  listeners.forEach(listener => listener(eventName, payload));
};

export default dispatchEvent;
