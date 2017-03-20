const { assert } = require('chai');
const nock = require('nock');
const R = require('ramda');
const Promise = require('bluebird');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const stubs = require('../../../shared/test-utils/stubs');
const userSerializer = require('../../integrations/adapters/pmt/serializers/user');
const networkRepo = require('../../core/repositories/network');
const teamRepo = require('../../core/repositories/team');

describe('Handler: Handle single network sync', () => {
  nock.disableNetConnect();
  let pmtNetwork;
  let globalAdmin;
  let alreadyImportedAdmin;
  let alreadyImportedUser;

  const externalIdUrl = 'http://network.com/';
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

  describe('Importing users', () => {
    before(async () => {
      // add admin and user to database
      [alreadyImportedAdmin, alreadyImportedUser, globalAdmin] = await Promise.all([
        testHelper.createUser(R.merge(initialAdmin, { password: 'foo' })),
        testHelper.createUser(R.merge(initialEmployee, { password: 'foo' })),
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
        networkId: network.id, name: intialTeam.name, externalId: intialTeam.externalId });

      const usersToAdd = R.map((user) => ({
        userId: user.id,
        networkId: network.id,
        isActive: true,
        externalId: user.externalId,
        roleType: 'ADMIN' }),
        [alreadyImportedUser]
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

    after(() => testHelper.cleanAll());

    afterEach(async () => {
      const allUsers = await testHelper.findAllUsers();
      const users = R.differenceWith((x, y) => x.email === y.email,
         allUsers,
        [alreadyImportedUser, alreadyImportedAdmin, globalAdmin]);

      // delete all users to reset the state of the network
      return testHelper.deleteUser(users);
    });

    it('should return success', async () => {
      nock(pmtNetwork.externalId)
        .get('/departments')
        .reply(200, stubs.departments)
        .get('/users')
        .reply(200, stubs.users_200);

      const endpoint = `/v2/network/${pmtNetwork.id}/sync`;
      const { statusCode } = await getRequest(endpoint, 'footoken');

      assert.equal(statusCode, 202);
    });
  });
});
