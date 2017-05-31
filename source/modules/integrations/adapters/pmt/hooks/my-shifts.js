const moment = require('moment');
const client = require('../client');
const shiftSerializer = require('../serializers/shift');

module.exports = (baseStoreUrl, token) => async () => {
  const date = moment().format('DD-MM-YYYY');
  const endpoint = `${baseStoreUrl}/me/shifts/${date}`;
  const result = await client.get(endpoint, token);

  if (!result.payload.shifts) return [];

  return result.payload.shifts.map(shiftSerializer);
};
