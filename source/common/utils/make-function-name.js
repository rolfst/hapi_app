import _ from 'lodash';

/**
 * Create function name based on User model
 * @param {number} networkId - The id of network
 * @param {User} user - The user model
 * @method makeFunctionName
 * @return {string} The function name
 */
export default (networkId, user) => {
  const teamsOfNetwork = user.Teams
    .filter(team => team.networkId === networkId);

  if (teamsOfNetwork.length === 0) {
    const network = _.find(user.Networks, { id: networkId });

    return network.name;
  }

  const teamNames = teamsOfNetwork.map(team => team.name);

  return teamNames[0];
};
