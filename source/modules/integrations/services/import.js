import createError from '../../../shared/utils/create-error';
import createAdapter from '../../../shared/utils/create-adapter';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as impl from './implementation';

export const importNetwork = async (payload) => {
  const network = await networkRepo.findNetworkById(payload.networkId);

  if (!network.externalId) throw createError('10001');

  const adapter = createAdapter(network, [], { proceedWithoutToken: true });

  const values = await Promise.all([
    adapter.fetchTeams(),
    adapter.fetchUsers(),
    userRepo.findAllUsers(),
  ]);

  const [externalTeams, externalUsers, internalUsers] = values;
  const importedUsers = await impl.importUsers(internalUsers, externalUsers, network);
  const importedTeams = await impl.importTeams(externalTeams, network);

  await impl.addUsersToTeam(importedUsers, importedTeams, externalUsers);
};
