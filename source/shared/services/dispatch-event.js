import * as Intercom from 'intercom-client';
import moment from 'moment';
import { pick } from 'lodash';

export const EventTypes = {
  NETWORK_CREATED: 'network-created', // TODO
  NETWORK_UPDATED: 'network-updated', // TODO
  USER_INVTED: 'user-invited',
  USER_UPDATED: 'user-updated', // TODO only /users/me is on node-api
  USER_UPDATED_ROLE: 'user-updated-role', // TODO
  USER_REMOVED: 'user-removed', // TODO
  EXCHANGE_CREATED: 'exchange-created',
  EXCHANGE_APPROVED: 'exchange-approved',
  MESSAGE_CREATED: 'message-created', // TODO
};

export function getClient() {
  return new Intercom.Client({ token: process.env.INTERCOM_TOKEN });
}

export default async (eventType, message, payload) => {
  const intercom = getClient();
  const { body: user } = await intercom.users.find({ email: message.username });
  const { custom_attributes } = user;

  const incrementUserCount = (email, key) => intercom.users.update({
    email,
    custom_attributes: { [key]: (custom_attributes[key] || 0) + 1 },
  });

  switch (eventType) {
    case EventTypes.USER_INVITED:
      intercom.users.create({
        user_id: payload.user.id,
        email: payload.user.email,
        name: payload.user.fullName,
        phone: payload.user.phoneNum,
        companies: [{ company_id: payload.network.id }],
        custom_attributes: { role: payload.role },
      });
      break;
    case EventTypes.USER_UPDATED:
      intercom.users.update({
        user_id: payload.user.id,
        email: payload.user.email,
        name: payload.user.fullName,
        phone: payload.user.phoneNum,
      });
      break;
    case EventTypes.USER_REMOVED:
      intercom.users.update({
        email: payload.user.email,
        companies: [{ company_id: payload.network.id, remove: true }],
      });
      break;
    case EventTypes.EXCHANGE_CREATED:
      intercom.events.create({
        event_name: EventTypes.EXCHANGE_CREATED,
        created_at: moment().unix(),
        email: user.email,
        metadata: pick(payload.exchange, 'networkId', 'date', 'startTime', 'endTime', 'type'),
      });

      incrementUserCount(user.email, 'created_shifts');
      break;
    case EventTypes.EXCHANGE_APPROVED:
      incrementUserCount(payload.approvedUser.email, 'exchanged_shifts');
      break;
    default: return null;
  }
};
