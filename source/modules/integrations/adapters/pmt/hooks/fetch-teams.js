const client = require('../client');
const teamSerializer = require('../serializers/team');

module.exports = (baseStoreUrl) => async () => {
  const result = await client.get(`${baseStoreUrl}/departments`);

  if (!result.payload.departments) return [];

  return result.payload.departments.map(teamSerializer);
};
