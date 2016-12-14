import { assert } from 'chai';
import nock from 'nock';
import { map, pick, differenceBy } from 'lodash';
import Promise from 'bluebird';
import { getRequest } from '../../../shared/test-utils/request';
import * as setup from '../../../shared/test-utils/setup';
import * as stubs from '../../../shared/test-utils/stubs';
import * as passwordUtil from '../../../shared/utils/password';
import userSerializer from '../../../adapters/pmt/serializers/user';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as teamRepo from '../../core/repositories/team';
import * as integrationRepo from '../../core/repositories/integration';

describe('Handle sync network', () => {
  nock.disableNetConnect();
  let network;
  let integration;
  let globalAdmin;
  let alreadyImportedAdmin;
  let alreadyImportedUser;

  const pristineNetwork = stubs.pristine_networks_admins[0];
  const initialAdmin = pristineNetwork.admins[0];
  const initialEmployee = userSerializer(stubs.users_200.data[0]);
  const EXISTING_TEAM_EXTERNALID = '28';
  const intialTeam = {
    externalId: EXISTING_TEAM_EXTERNALID,
    name: 'Vleesafdeling',
  };
  const adminCredentials = {
    username: 'syncUser@flex-appeal.nl',
    password: 'syncUserPassword',
    email: 'syncUser@flex-appeal.nl',
    firstName: 'sync',
    lastName: 'User',
  };

  const createIntegration = () => integrationRepo.createIntegration({
    name: pristineNetwork.integrationName,
    token: 'footoken',
  });

  const createIntegrationNetwork = (user) => networkRepo.createIntegrationNetwork({
    ...pick(pristineNetwork, 'externalId', 'name', 'integrationName'),
    userId: user.id,
  });

  describe('Importing users', () => {
    before(async () => {
      await setup.finalCleanup();
      // add admin and user to database
      alreadyImportedAdmin = await userRepo.createUser({
        ...initialAdmin, password: passwordUtil.plainRandom() });
      alreadyImportedUser = await userRepo.createUser({
        ...initialEmployee, password: passwordUtil.plainRandom() });
      globalAdmin = await userRepo.createUser(adminCredentials);

      alreadyImportedAdmin.externalId = initialAdmin.userId;
      alreadyImportedUser.externalId = initialEmployee.externalId;

      integration = await createIntegration();
      network = await createIntegrationNetwork(alreadyImportedAdmin);
      await teamRepo.createTeam({
        networkId: network.id, name: intialTeam.name, externalId: intialTeam.externalId });

      const usersToAdd = map([alreadyImportedAdmin, alreadyImportedUser],
        (user) => ({
          userId: user.id,
          networkId: network.id,
          isActive: true,
          externalId: user.externalId,
          roleType: 'ADMIN' })
      );

      usersToAdd.push({
        userId: globalAdmin.id,
        networkId: network.id,
        isActive: true,
        roleType: 'ADMIN',
        invisibleUser: true,
      });

      return Promise.map(usersToAdd, networkRepo.addUser);
    });

    after(async () => {
      await userRepo.deleteById(alreadyImportedAdmin.id);

      await Promise.all([
        integrationRepo.deleteById(integration.id),
        userRepo.deleteById(globalAdmin.id),
        userRepo.deleteById(alreadyImportedUser.id),
      ]);

      return setup.initialSetup();
    });

    afterEach(async () => {
      const allUsers = await networkRepo.findAllUsersForNetwork(network.id);
      const users = differenceBy(allUsers,
        [alreadyImportedUser, alreadyImportedAdmin, globalAdmin], 'email');

      // delete all users to reset the state of the network
      return Promise.map(map(users, 'id'), userRepo.deleteById);
    });

    it('should return success', async () => {
      nock(network.externalId)
        .get('/departments')
        .reply(200, stubs.departments)
        .get('/users')
        .reply(200, stubs.users_200);

      const endpoint = '/v2/integrations/sync';
      const { statusCode } = await getRequest(endpoint, global.server, 'footoken');

      assert.equal(statusCode, 202);
    });
  });
});
