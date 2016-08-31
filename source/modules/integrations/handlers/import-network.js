import log from 'common/services/logger';
import { findNetworkById } from 'common/repositories/network';
import * as userRepo from 'common/repositories/user';
import createAdapter from 'common/utils/create-adapter';
import importUsers from 'modules/integrations/services/import-users';
import importTeams from 'modules/integrations/services/import-teams';
import addUsersToTeam from 'modules/integrations/services/add-users-to-team';

export default async (req, reply) => {
  try {
    const network = await findNetworkById(req.params.networkId);

    if (!network.externalId) throw new Error('This network has no integration.');

    const adapter = createAdapter(network, [], { proceedWithoutToken: true });

    const values = await Promise.all([
      adapter.fetchTeams(),
      adapter.fetchUsers(),
      userRepo.findAllUsers(),
    ]);

    const [externalTeams, externalUsers, internalUsers] = values;
    const users = await importUsers(internalUsers, externalUsers, network);
    const teams = await importTeams(externalTeams, network);

    await addUsersToTeam(users, teams, externalUsers);

    return reply({ success: true });
  } catch (err) {
    log.error('Could not import network', { stack: err.stack, network_id: req.params.networkId });

    return reply(err);
  }
};
