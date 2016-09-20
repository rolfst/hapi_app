import { find } from 'lodash';
import createError from './create-error';

export const select = (networks, networkId) => {
  const network = find(networks, { id: parseInt(networkId, 10) });

  if (!network) throw createError('10002');

  return network;
};

export const hasIntegration = network => network.Integrations.length > 0;

export const makeFunctionName = (networkId, user) => {
  const network = select(user.Networks, networkId);

  if (network.NetworkUser.deletedAt !== null) return 'Verwijderd';

  const teamsOfNetwork = user.Teams
    .filter(team => team.networkId === networkId);

  if (teamsOfNetwork.length === 0) return network.name;

  const teamNames = teamsOfNetwork.map(team => team.name);

  return teamNames[0];
};

export const addUserScope = (userModel, networkId) => {
  const newUserModel = userModel;
  const selectedNetwork = select(userModel.Networks, networkId);

  newUserModel.functionName = makeFunctionName(parseInt(networkId, 10), userModel);
  newUserModel.integrationAuth = !!selectedNetwork.NetworkUser.userToken;
  newUserModel.role = selectedNetwork.NetworkUser.roleType;

  return newUserModel;
};
