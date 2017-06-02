const client = require('../client');
const userSerializer = require('../serializers/user');

function fetchUsers(baseStoreUrl) {
  return async () => {
    const result = await client.get(`${baseStoreUrl}/users`);
    if (!result.payload.data) return [];

    return result.payload.data.map(userSerializer);
  };
}

module.exports = fetchUsers;
