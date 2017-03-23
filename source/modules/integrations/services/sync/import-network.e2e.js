const { assert } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const Promise = require('bluebird');
const { find, map } = require('lodash');
const R = require('ramda');
const stubs = require('../../../../shared/test-utils/stubs');
const testHelper = require('../../../../shared/test-utils/helpers');
const adapterUtil = require('../../../../shared/utils/create-adapter');
const passwordUtil = require('../../../../shared/utils/password');
const configurationMailNewAdmin = require('../../../../shared/mails/configuration-invite-newadmin');
const mailer = require('../../../../shared/services/mailer');
const userSerializer = require('../../../integrations/adapters/pmt/serializers/user');
const networkRepo = require('../../../core/repositories/network');
const userService = require('../../../core/services/user');
const userRepo = require('../../../core/repositories/user');
const teamRepo = require('../../../core/repositories/team');
const syncService = require('./index');

describe('Import network', () => {
  let sandbox;
  let network;
  let admin;
  const pristineNetwork = stubs.pristine_networks_admins[0];
  const employee = pristineNetwork.admins[0];
  const externalUsers = map(stubs.users_200.data, userSerializer);
  const fakeAdapter = {
    fetchTeams: () => stubs.external_teams,
    fetchUsers: () => externalUsers,
  };

  describe('Happy path', async () => {
    describe('general', () => {
      before(async () => {
        sandbox = sinon.sandbox.create();

        nock(pristineNetwork.externalId)
          .get('/users')
          .reply(200, stubs.users_200);

        admin = await testHelper.createUser({ password: 'pw' });
        const { network: netw } = await testHelper.createNetworkWithIntegration(R.merge(
          { userId: admin.id },
          R.pick(['externalId', 'name', 'integrationName'], pristineNetwork)
          ));
        network = netw;

        sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve(fakeAdapter));
        sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
        sandbox.stub(mailer, 'send').returns(Promise.resolve(true));

        await syncService.importNetwork({
          networkId: network.id,
          internal: true,
          ownerEmail: employee.email,
        });
      });

      after(async () => {
        sandbox.restore();
        const reloadedNetwork = await networkRepo.findNetworkById(network.id);
        const findAllNormalUsers = R.reject((user) =>
          (user.id === reloadedNetwork.superAdmin.id || user.id === admin.id));
        const users = await networkRepo.findAllUsersForNetwork(network.id);
        await testHelper.deleteUser(findAllNormalUsers(users));

        return testHelper.cleanAll();
      });

      it('should set external user as admin in the network', async () => {
        const foundNetwork = await networkRepo.findNetwork({
          externalId: pristineNetwork.externalId });
        const user = await userService.getUserWithNetworkScope({
          id: foundNetwork.superAdmin.id,
          networkId: foundNetwork.id,
        });

        assert.equal(foundNetwork.superAdmin.id, user.id);
        assert.equal(user.externalId, employee.userId);
      });

      it.skip('should send configuration email', async () => {
        const foundNetwork = await networkRepo.findNetwork({
          externalId: pristineNetwork.externalId });
        const user = await userRepo.findUserBy({ username: employee.email });
        const configuration = configurationMailNewAdmin(foundNetwork, user, 'testpassword');

        assert.deepEqual(mailer.send.firstCall.args[0], configuration);
      });

      it('should add new teams to network', async () => {
        const teams = await networkRepo.findTeamsForNetwork(network.id);
        const actual = find(teams, { externalId: stubs.external_teams[0].externalId });

        assert.lengthOf(teams, stubs.external_teams.length);
        assert.isDefined(actual);
        assert.equal(actual.name, stubs.external_teams[0].name);
      });

      it('should add new admins to network', async () => {
        const admins = await networkRepo.findUsersForNetwork(network.id, { roleType: 'ADMIN' });

        assert.lengthOf(admins, 2);
      });

      it('should add new unique users to network', async () => {
        const activeUsers = await networkRepo.findUsersForNetwork(network.id);

        assert.lengthOf(activeUsers, 14);
      });

      it('should add new users to teams', async () => {
        const teams = await networkRepo.findTeamsForNetwork(network.id);
        const teamLookup = find(teams, { externalId: stubs.external_teams[0].externalId });
        const users = await teamRepo.findMembers(teamLookup.id);

        assert.lengthOf(users, 10);
      });

      it('should add new teams to network', async () => {
        const teams = await networkRepo.findTeamsForNetwork(network.id);
        const actual = find(teams, { externalId: stubs.external_teams[0].externalId });

        assert.lengthOf(teams, stubs.external_teams.length);
        assert.isDefined(actual);
        assert.equal(actual.name, stubs.external_teams[0].name);
      });
    });
  });

  describe('Fault path', async () => {
    before(async () => {
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      sandbox = sinon.sandbox.create();
      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve(fakeAdapter));
      sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');

      admin = await testHelper.createUser({ password: 'pw' });
      const { network: netw } = await testHelper.createNetworkWithIntegration(R.merge(
        { userId: admin.id },
        R.pick(['externalId', 'name', 'integrationName'], pristineNetwork)
      ));
      network = netw;
    });

    after(async () => {
      sandbox.restore();

      return testHelper.cleanAll();
    });

    it('should return 404 when network does not exists', async () => {
      const result = syncService.importNetwork({
        ownerEmail: employee.email,
        networkId: 0,
      }, { credentials: admin });

      await assert.isRejected(result, 'Network not found.');
    });

    it('should return 422 external user with email not found', async () => {
      const result = syncService.importNetwork({
        ownerEmail: 'wrongemail',
        networkId: network.id,
      });

      await assert.isRejected(result, 'The user could no longer be found in external network.');
    });

    it('should return 403 when network is already imported', async () => {
      await networkRepo.setImportDateOnNetworkIntegration(network.id);

      const result = syncService.importNetwork({
        ownerEmail: employee.email,
        networkId: network.id,
      }, { credentials: admin });

      await assert.isRejected(result, 'The network has already been imported.');
    });

    it('should return 403 when no integration has been enabled for the network', async () => {
      const networkWithoutIntegration = await networkRepo.createNetwork(
        admin.id, pristineNetwork.name, pristineNetwork.externalId);

      const result = syncService.importNetwork({
        ownerEmail: employee.email,
        networkId: networkWithoutIntegration.id,
      }, { credentials: admin });

      await networkRepo.deleteById(network.id);

      await assert.isRejected(result, 'The network does not have an enabled integration');
    });
  });
});
