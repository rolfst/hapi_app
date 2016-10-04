import { assert } from 'chai';
import sinon from 'sinon';
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

  describe('Happy path', async () => {
    let integration;

    before(async () => {
      const fakeAdapter = {
        fetchTeams: () => stubs.external_teams,
        fetchUsers: () => stubs.external_users,
      };

      integration = await integrationRepo.createIntegration({
        name: pristineNetwork.integrationName,
        token: 'footoken',
      });

      sinon.stub(createAdapter, 'default').returns(fakeAdapter);
    });

    after(async () => {
      const network = await networkRepo.findNetwork({ name: pristineNetwork.name });
      const users = await networkRepo.findAllUsersForNetwork(network);
      const createdUser = await userRepo.findUserByUsername(employee.username);
      createAdapter.default.restore();
      mailer.send.restore();
      sinon.stub(mailer, 'send').returns(null);

      await createdUser.destroy();
      await integration.destroy();
      await network.destroy();

      return Promise.all(users.map(u => u.destroy()));
    });

    it('should succeed', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        ...employee,
        ...pick(pristineNetwork, ['name', 'networkId', 'integrationName']),
      });

      const network = await networkRepo.findNetwork({
        externalId: pristineNetwork.networkId, name: pristineNetwork.name });
      const user = await userRepo.findUserByUsername(employee.username);
      const configuration = configurationMail(network, user);

      assert.equal(response.statusCode, 200);
      assert.equal(mailer.send.calledWithMatch(configuration), true);
    });
  });

  describe('Fault path', async () => {
    before(async () => {
      const fakeAdapter = {
        fetchTeams: () => stubs.external_teams,
        fetchUsers: () => stubs.external_users,
      };

      sinon.stub(createAdapter, 'default').returns(fakeAdapter);

      const user = await userRepo.createUser({ ...employee });
      await networkRepo.createNetwork(
        user.id,
        pristineNetwork.name,
        pristineNetwork.networkId);
    });

    after(async () => {
      const network = await networkRepo.findNetwork({ name: pristineNetwork.name });
      createAdapter.default.restore();

      return network.destroy();
    });

    it('should fail on already imported network', async () => {
      const response = await postRequest('/v2/pristine_networks/import', {
        ...employee,
        ...pick(pristineNetwork, ['name', 'networkId', 'integrationName']),
      });

      assert.equal(response.statusCode, 403);
    });
  });
});
