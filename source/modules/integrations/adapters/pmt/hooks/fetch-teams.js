const { map } = require('lodash');
const client = require('../client');
const teamSerializer = require('../serializers/team');

export default (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/departments`);

  return map(result.payload.departments, teamSerializer);
};
