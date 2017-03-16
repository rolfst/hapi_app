const { get, omit, map, intersectionBy } = require('lodash');
const client = require('../client');
const userSerializer = require('../serializers/user');

export function fetchUsers(baseStoreUrl) {
  return async () => {
    const result = await client.get(`${baseStoreUrl}/users`);

    return map(result.payload.data, userSerializer);
  };
}

export default fetchUsers;

const findExternalTeams = (user) => {
  return map(get(user, 'teamIds'), (id) => ({ externalId: id }));
};

export async function getUsers(baseStoreUrl, teams) {
  const result = await client.get(`${baseStoreUrl}/users`);
  const users = map(result.payload.data, userSerializer);
  return map(users, (user) => {
    const externalTeams = findExternalTeams(user);
    const linkedTeams = map(intersectionBy(teams, externalTeams, 'externalId'), 'id');
    return { ...omit(user, 'teamIds'), teamIds: linkedTeams };
  });
}
