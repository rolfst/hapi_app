import { assert } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import { pick, find, map } from 'lodash';
import { postRequest } from '../../../shared/test-utils/request';
import stubs from '../../../shared/test-utils/stubs';
import * as adapterUtil from '../../../shared/utils/create-adapter';
import * as passwordUtil from '../../../shared/utils/password';
import configurationMail from '../../../shared/mails/configuration-invite-newadmin';
import * as mailer from '../../../shared/services/mailer';
import userSerializer from '../../../adapters/pmt/serializers/user';
import * as networkRepo from '../repositories/network';
import * as userRepo from '../repositories/user';
import * as teamRepo from '../repositories/team';
import * as integrationRepo from '../repositories/integration';

describe('Import network', () => {
  let sandbox;
  let network;
  let response;
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

        sandbox.stub(adapterUtil, 'createAdapter').returns(fakeAdapter);
        sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
        sandbox.stub(mailer, 'send').returns(null);

        response = await postRequest(`/v2/networks/${network.id}/integration/import`, {
          external_username: employee.email,
        }, global.server, 'footoken');
      });

      after(async () => {
        network = await findNetwork();

        const users = await networkRepo.findAllUsersForNetwork(network.id);
        const createdUser = await userRepo.findUserByUsername(employee.username);

        sandbox.restore();

        await userRepo.deleteById(createdUser.id);
        await integration.destroy();
        await networkRepo.deleteById(network.id);

        return Promise.all(users.map(u => userRepo.deleteById(u.id)));
      });

      it('should succeed', async () => {
        assert.equal(response.statusCode, 200);
      });

      it('should set external user as admin in the network', async () => {
        const foundNetwork = await networkRepo.findNetwork({
          externalId: pristineNetwork.externalId });
        const user = await userRepo.findUserByUsername(employee.email);

        assert.equal(foundNetwork.superAdmin.id, user.id);
      });

      it('should send configuration email', async () => {
        const foundNetwork = await networkRepo.findNetwork({
          externalId: pristineNetwork.externalId });
        const user = await userRepo.findUserByUsername(employee.email);
        const configuration = configurationMail(foundNetwork, user, 'testpassword');

        assert.equal(mailer.send.calledWithMatch(configuration), true);
      });

      it('should add new teams to network', async () => {
        const teams = await networkRepo.findTeamsForNetwork(network.id);
        const actual = find(teams, { externalId: stubs.external_teams[0].externalId });

        assert.lengthOf(teams, stubs.external_teams.length);
        assert.isDefined(actual);
        assert.equal(actual.name, stubs.external_teams[0].name);
      });

      it('should add new admins to network', async () => {
        const admins = await networkRepo.findUsersForNetwork(network.id, 'ADMIN');

        assert.lengthOf(admins, 3);
      });

      it('should add new users to network', async () => {
        const activeUsers = await networkRepo.findUsersForNetwork(network.id);

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

    describe('double imports of users', () => {
      let integration;

      before(async () => {
        sandbox = sinon.sandbox.create();

        nock(pristineNetwork.externalId)
          .get('/users')
          .reply(200, stubs.users_200);

        integration = await createIntegration();
        network = await createIntegrationNetwork();

        sandbox.stub(adapterUtil, 'createAdapter').returns(fakeAdapter);
        sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
        sandbox.stub(mailer, 'send').returns(null);
      });

      after(async () => {
        network = await findNetwork();

        const users = await networkRepo.findAllUsersForNetwork(network.id);
        const createdUser = await userRepo.findUserByUsername(employee.username);

        sandbox.restore();

        await userRepo.deleteById(createdUser.id);
        await integration.destroy();
        await networkRepo.deleteById(network.id);

        return Promise.all(users.map(u => userRepo.deleteById(u.id)));
      });

      it('should succeed on import with user in database', async () => {
        const userAttributes = { ...employee, password: passwordUtil.plainRandom() };
        const alreadyImportedUser = userRepo.createUser(userAttributes);
        response = await postRequest(`/v2/networks/${network.id}/integration/import`, {
          external_username: employee.email,
        }, global.server, 'footoken');

        await userRepo.deleteById(alreadyImportedUser.id);

        assert.equal(response.statusCode, 200);
      });
    });
  });

  describe('Fault path', async () => {
    let integration;

    describe('setup in order', () => {
      before(async () => {
        nock(pristineNetwork.externalId)
          .get('/users')
          .reply(200, stubs.users_200);

        sandbox = sinon.sandbox.create();
        sandbox.stub(adapterUtil, 'createAdapter').returns(fakeAdapter);
        sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
        sandbox.stub(mailer, 'send').returns(null);

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

      it('should fail on missing username', async () => {
        const res = await postRequest(`/v2/networks/${network.id}/integration/import`, {});

        assert.equal(res.statusCode, 422);
      });

      it('should fail on already imported network', async () => {
        networkRepo.setImportDateOnNetworkIntegration(network.id);

        const res = await postRequest(`/v2/networks/${network.id}/integration/import`, {
          external_username: employee.email,
        }, global.server, 'footoken');
        networkRepo.unsetImportDateOnNetworkIntegration(network.id);

        assert.equal(res.statusCode, 403);
      });
    });

    describe('setup missing', () => {
      before(async () => {
        network = await networkRepo.createNetwork(
          global.users.admin.id, pristineNetwork.name, pristineNetwork.externalId);
      });

      after(async () => {
        return networkRepo.deleteById(network.id);
      });

      it('should fail when no integration has been enabled for the network', async () => {
        const res = await postRequest(`/v2/networks/${network.id}/integration/import`,
          { external_username: employee.email,
        }, global.server, 'footoken');

        assert.equal(res.statusCode, 403);
      });
    });
  });
});
