const R = require('ramda');
const { get, map, intersectionBy } = require('lodash');
const client = require('../client');
const userSerializer = require('../serializers/user');

function fetchUsers(baseStoreUrl) {
  return async () => {
    const result = await client.get(`${baseStoreUrl}/users`);

    return map(result.payload.data, userSerializer);
  };
}

const findExternalTeams = (user) => {
  return map(get(user, 'teamIds'), (id) => ({ externalId: id }));
};

async function getUsers(baseStoreUrl, teams) {
  const result = await client.get(`${baseStoreUrl}/users`);
  const users = map(result.payload.data, userSerializer);
  return map(users, (user) => {
    const externalTeams = findExternalTeams(user);
    const linkedTeams = map(intersectionBy(teams, externalTeams, 'externalId'), 'id');

    return R.merge(R.omit(['teamIds'], user), { teamIds: linkedTeams });
  });
}

// exports of functions
module.exports = {
  fetchUsers,
  getUsers,
};
