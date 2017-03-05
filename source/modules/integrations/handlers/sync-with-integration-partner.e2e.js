import { assert } from 'chai';
import nock from 'nock';
import { map, differenceBy } from 'lodash';
import Promise from 'bluebird';
import * as testHelper from '../../../shared/test-utils/helpers';
import { getRequest } from '../../../shared/test-utils/request';
import * as stubs from '../../../shared/test-utils/stubs';
import userSerializer from '../../integrations/adapters/pmt/serializers/user';
import * as networkRepo from '../../core/repositories/network';
import * as teamRepo from '../../core/repositories/team';

describe('Handle sync networks of linked to integration', () => {
  nock.disableNetConnect();
  let pmtNetwork;
  let globalAdmin;
  let alreadyImportedAdmin;
  let alreadyImportedUser;

  const externalIdUrl = 'http://network.com/';
  const pristinepmtNetwork = stubs.pristine_networks_admins[0];
  const initialAdmin = pristinepmtNetwork.admins[0];
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

  describe('Importing users', () => {
    before(async () => {
      // add admin and user to database
      [alreadyImportedAdmin, alreadyImportedUser, globalAdmin] = await Promise.all([
        testHelper.createUser({ ...initialAdmin, password: 'pw' }),
        testHelper.createUser({ ...initialEmployee, password: 'pw' }),
        testHelper.createUser(adminCredentials),
      ]);
      alreadyImportedAdmin.externalId = '10032';
      alreadyImportedUser.externalId = '10033';

      const { network } = await testHelper.createNetworkWithIntegration({
        userId: alreadyImportedAdmin.id,
        externalId: externalIdUrl,
        name: 'network-PMT',
        integrationName: 'PMT',
        integrationToken: 'footoken',
        userExternalId: alreadyImportedAdmin.externalId,
        userToken: 'ad34e192f03c',
      });
      pmtNetwork = network;

      await teamRepo.create({
        networkId: pmtNetwork.id, name: intialTeam.name, externalId: intialTeam.externalId });
      const usersToAdd = map([alreadyImportedUser],
        (user) => ({
          userId: user.id,
          networkId: pmtNetwork.id,
          isActive: true,
          externalId: user.externalId,
          roleType: 'ADMIN' })
      );

      usersToAdd.push({
        userId: globalAdmin.id,
        networkId: pmtNetwork.id,
        isActive: true,
        roleType: 'ADMIN',
        invisibleUser: true,
      });

      return Promise.map(usersToAdd, networkRepo.addUser);
    });

    after(() => testHelper.cleanAll());

    afterEach(async () => {
      const allUsers = await testHelper.findAllUsers();
      const users = differenceBy(allUsers,
        [alreadyImportedUser, alreadyImportedAdmin, globalAdmin], 'email');

      // delete all users to reset the state of the pmtNetwork
      return testHelper.deleteUser(users);
    });

    it('should return success', async () => {
      nock(pmtNetwork.externalId)
        .get('/departments')
        .reply(200, stubs.departments)
        .get('/users')
        .reply(200, stubs.users_200);

      const endpoint = '/v2/integrations/sync';
      const { statusCode } = await getRequest(endpoint, 'footoken');

      assert.equal(statusCode, 202);
    });
  });
});
