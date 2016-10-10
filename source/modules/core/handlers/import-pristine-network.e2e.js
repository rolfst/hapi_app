import { assert } from 'chai';
import sinon from 'sinon';
import nock from 'nock';
import { pick } from 'lodash';
import { postRequest } from '../../../shared/test-utils/request';
import stubs from '../../../shared/test-utils/stubs';
import * as createAdapter from '../../../shared/utils/create-adapter';
import configurationMail from '../../../shared/mails/configuration-invite';
import * as mailer from '../../../shared/services/mailer';
import * as networkRepo from '../repositories/network';
import * as userRepo from '../repositories/user';
import * as integrationRepo from '../repositories/integration';

describe('Import pristine network', () => {
  const pristineNetwork = stubs.pristine_networks_admins[0];
  const employee = pristineNetwork.admins[0];
  let sandbox;

  describe('Happy path', async () => {
    let integration;

    before(async () => {
      nock(pristineNetwork.externalId)
      .get('/users')
      .reply(200, stubs.users_200);

      sandbox = sinon.sandbox.create();
      const fakeAdapter = {
        fetchTeams: () => stubs.external_teams,
        fetchUsers: () => stubs.external_users,
      };

      integration = await integrationRepo.createIntegration({
        name: pristineNetwork.integrationName,
        token: 'footoken',
      });

      sandbox.stub(createAdapter, 'default').returns(fakeAdapter);
    });

    after(async () => {
      const network = await networkRepo.findNetwork({ name: pristineNetwork.name });
      const users = await networkRepo.findAllUsersForNetwork(network);
      const createdUser = await userRepo.findUserByUsername(employee.username);
      sandbox.restore();
      mailer.send.restore();
      sinon.stub(mailer, 'send').returns(null);

      await createdUser.destroy();
      await integration.destroy();
      await network.destroy();

      return Promise.all(users.map(u => u.destroy()));
    });

    it('should succeed', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        userId: employee.userId,
        ...pick(pristineNetwork, ['name', 'externalId', 'integrationName']),
      });

      const network = await networkRepo.findNetwork({
        externalId: pristineNetwork.externalId, name: pristineNetwork.name });
      const user = await userRepo.findUserByUsername(employee.username);
      const configuration = configurationMail(network, user);

      assert.equal(response.statusCode, 200);
      assert.equal(mailer.send.calledWithMatch(configuration), true);
    });
  });

  describe('Fault path', async () => {
    before(async () => {
      sandbox = sinon.sandbox.create();
      const fakeAdapter = {
        fetchTeams: () => stubs.external_teams,
        fetchUsers: () => stubs.external_users,
      };

      sandbox.stub(createAdapter, 'default').returns(fakeAdapter);

      const user = await userRepo.createUser({ ...employee });
      await networkRepo.createNetwork(
        user.id,
        pristineNetwork.name,
        pristineNetwork.externalId);
    });

    after(async () => {
      sandbox.restore();
      const network = await networkRepo.findNetwork({ name: pristineNetwork.name });

      return network.destroy();
    });

    it('should fail on missing userId', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        ...pick(pristineNetwork, ['name', 'externalId', 'integrationName']),
      });

      assert.equal(response.statusCode, 422);
    });

    it('should fail on missing externalId', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        userId: employee.userId,
        ...pick(pristineNetwork, ['name', 'integrationName']),
      });
      assert.equal(response.statusCode, 422);
    });

    it('should fail on missing integrationName', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        userId: employee.userId,
        ...pick(pristineNetwork, ['name', 'externalId']),
      });
      assert.equal(response.statusCode, 422);
    });

    it('should fail on missing networkName', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        userId: employee.userId,
        ...pick(pristineNetwork, ['integrationName', 'externalId']),
      });
      assert.equal(response.statusCode, 422);
    });

    it('should fail on already imported network', async () => {
      nock(pristineNetwork.externalId)
      .get('/users')
      .reply(200, stubs.users_200);

      const response = await postRequest('/v2/pristine_networks/import', {
        userId: employee.userId,
        ...pick(pristineNetwork, ['name', 'externalId', 'integrationName']),
      });

      assert.equal(response.statusCode, 403);
    });
  });
});
