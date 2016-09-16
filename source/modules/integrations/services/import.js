import createAdapter from '../../../common/utils/create-adapter';
import * as networkRepo from '../../../common/repositories/network';
import * as userRepo from '../../../common/repositories/user';
import * as impl from './impl';

export const importNetwork = async (payload) => {
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network.externalId) throw new Error('This network has no integration.');

  const adapter = createAdapter(network, [], { proceedWithoutToken: true });

  const values = await Promise.all([
    adapter.fetchTeams(),
    adapter.fetchUsers(),
    userRepo.findAllUsers(),
  ]);

  const [externalTeams, externalUsers, internalUsers] = values;
  const users = await impl.importUsers(internalUsers, externalUsers, network);
  const teams = await impl.importTeams(externalTeams, network);

  await impl.addUsersToTeam(users, teams, externalUsers);
};
