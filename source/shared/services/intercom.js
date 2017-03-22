const moment = require('moment');
const Intercom = require('intercom-client');

const getClient = () =>
  new Intercom.Client({ token: process.env.INTERCOM_TOKEN || 'foofortesting' });

const incrementAttribute = (email, attributeName) => {
  const client = getClient();
  const updatingUser = client.users.find({ email });

  if (!updatingUser) return;

  return client.users.update({ email, custom_attributes: {
    [attributeName]: updatingUser[attributeName] + 1,
  } });
};

const createEvent = (email, eventName, meta) => getClient().events.create({
  email,
  event_name: eventName,
  created_at: moment().unix(),
  metadata: meta,
});

exports.createEvent = createEvent;
exports.getClient = getClient;
exports.incrementAttribute = incrementAttribute;
