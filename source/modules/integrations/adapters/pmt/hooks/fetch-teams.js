const R = require('ramda');
const client = require('../client');
const teamSerializer = require('../serializers/team');

module.exports = (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/departments`);

  return R.map(teamSerializer, result.payload.departments);
};
