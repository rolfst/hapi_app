import moment from 'moment';
import * as Intercom from 'intercom-client';

export const getClient = () =>
  new Intercom.Client({ token: process.env.INTERCOM_TOKEN });

export const incrementAttribute = (email, attributeName) => {
  const client = getClient();
  const updatingUser = client.users.find({ email });

  if (!updatingUser) return;

  return client.users.update({ email, custom_attributes: {
    [attributeName]: updatingUser[attributeName] + 1,
  } });
};

export const createEvent = (email, eventName, meta) => getClient().events.create({
  email,
  event_name: eventName,
  created_at: moment().unix(),
  metadata: meta,
});
