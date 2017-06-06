const client = require('../client');
const userSerializer = require('../serializers/user');

module.exports = (baseStoreUrl, token) => async (shiftId) => {
  const endpoint = `${baseStoreUrl}/shift/${shiftId}/available`;
  const result = await client.get(endpoint, token);

  if (!result.payload.users) return [];

  return result.payload.users.map(userSerializer);
};
