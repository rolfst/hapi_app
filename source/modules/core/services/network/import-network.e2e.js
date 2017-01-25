import { assert } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import Promise from 'bluebird';
import { pick, find, map } from 'lodash';
import stubs from '../../../../shared/test-utils/stubs';
import * as adapterUtil from '../../../../shared/utils/create-adapter';
import * as passwordUtil from '../../../../shared/utils/password';
import configurationMailNewAdmin from '../../../../shared/mails/configuration-invite-newadmin';
import * as mailer from '../../../../shared/services/mailer';
import userSerializer from '../../../../adapters/pmt/serializers/user';
import * as networkRepo from '../../repositories/network';
import * as networkService from './index';
import * as networkServiceImpl from './implementation';
import * as userService from '../user';
import * as userRepo from '../../repositories/user';
import * as teamRepo from '../../repositories/team';
import * as integrationRepo from '../../repositories/integration';

describe('Import network', () => {
  let sandbox;
  let network;
  const pristineNetwork = stubs.pristine_networks_admins[0];
  const employee = pristineNetwork.admins[0];
  const externalUsers = map(stubs.users_200.data, userSerializer);
  const fakeAdapter = {
    fetchTeams: () => stubs.external_teams,
    fetchUsers: () => externalUsers,
  };

  const createIntegration = () => integrationRepo.createIntegration({
    name: pristineNetwork.integrationName,
    token: 'footoken',
  });

  const createIntegrationNetwork = async () => networkRepo.createIntegrationNetwork({
    ...pick(pristineNetwork, 'externalId', 'name', 'integrationName'),
    userId: global.users.admin.id,
  });

  const findNetwork = () => networkRepo.findNetwork({
    externalId: pristineNetwork.externalId,
    name: pristineNetwork.name,
  });

  describe('Happy path', async () => {
    describe('general', () => {
      let integration;

      before(async () => {
        sandbox = sinon.sandbox.create();

        nock(pristineNetwork.externalId)
          .get('/users')
          .reply(200, stubs.users_200);

        integration = await createIntegration();
        network = await createIntegrationNetwork();

        sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve(fakeAdapter));
        sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
        mailer.send.reset();

        await networkServiceImpl.importNetwork(network, employee.username);
      });

      after(async () => {
        network = await findNetwork();

        const users = await networkRepo.findAllUsersForNetwork(network.id);
        const createdUser = await userRepo.findUserBy({ username: employee.username });

        sandbox.restore();

        await userRepo.deleteById(createdUser.id);
        await integration.destroy();
        await networkRepo.deleteById(network.id);

        return Promise.map(users, user => userRepo.deleteById(user.id));
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

      it('should send configuration email', async () => {
        const foundNetwork = await networkRepo.findNetwork({
          externalId: pristineNetwork.externalId });
        const user = await userRepo.findUserBy({ username: employee.username });
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
        const admins = await networkRepo.findUsersForNetwork({
          networkId: network.id, roleType: 'ADMIN' });

        assert.lengthOf(admins, 1);
      });

      it('should add new unique users to network', async () => {
        const activeUsers = await networkRepo.findUsersForNetwork({
          networkId: network.id });

        assert.lengthOf(activeUsers, 13);
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
    let integration;

    before(async () => {
      nock(pristineNetwork.externalId)
        .get('/users')
        .reply(200, stubs.users_200);

      sandbox = sinon.sandbox.create();
      sandbox.stub(adapterUtil, 'createAdapter').returns(Promise.resolve(fakeAdapter));
      sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');

      integration = await createIntegration();
      network = await createIntegrationNetwork();
    });

    after(async () => {
      sandbox.restore();
      network = await findNetwork();

      const users = await networkRepo.findAllUsersForNetwork(network.id);

      await integration.destroy();
      await networkRepo.deleteById(network.id);

      return Promise.all(users.map(u => userRepo.deleteById(u.id)));
    });

    it('should return 404 when network does not exists', async () => {
      const result = networkService.importNetwork({
        external_username: employee.username,
        networkId: 0,
      }, { credentials: global.users.admin.id });

      await assert.isRejected(result, /Error: Network not found./);
    });

    it('should return 422 when missing username', async () => {
      const result = networkService.importNetwork({
        external_username: employee.username,
        networkId: 0,
      }, { credentials: global.users.admin.id });

      await assert.isRejected(result, /Error: Network not found./);
    });

    it('should return 403 when network is already imported', async () => {
      await networkRepo.setImportDateOnNetworkIntegration(network.id);

      const result = networkService.importNetwork({
        external_username: employee.username,
        networkId: network.id,
      }, { credentials: global.users.admin.id });

      await assert.isRejected(result, /Error: The network has already been imported./);
    });

    it('should return 403 when no integration has been enabled for the network', async () => {
      const networkWithoutIntegration = await networkRepo.createNetwork(
        global.users.admin.id, pristineNetwork.name, pristineNetwork.externalId);

      const result = networkService.importNetwork({
        external_username: employee.username,
        networkId: networkWithoutIntegration.id,
      }, { credentials: global.users.admin.id });

      await networkRepo.deleteById(network.id);

      await assert.isRejected(result, /Error: The network does not have an enabled integration/);
    });
  });
});
