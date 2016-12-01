import { first } from 'lodash';
import Promise from 'bluebird';
import blueprints from './blueprints';
import { UserRoles } from '../services/permission';
import * as networkRepo from '../../modules/core/repositories/network';
import * as networkService from '../../modules/core/services/network';
import * as testHelper from './helpers';

describe('test helper', () => {
  describe('createUser', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();

      return testHelper.deleteUsers(users);
    });

    it('should create a user', async () => {
      await testHelper.createUser({
        username: 'testHelper', firstName: 'test', lastName: 'Helper', email: 'testHelper@flex-appeal.nl',
        password: 'password',
      });
      const users = await testHelper.findAllUsers();
      const user = first(users);

      assert.equal(users.length, 1);
      assert.equal(user.username, 'testHelper');
      assert.equal(user.firstName, 'test');
      assert.equal(user.lastName, 'Helper');
      assert.equal(user.email, 'testHelper@flex-appeal.nl');
    });
  });
  describe('createIntegration', () => {
    afterEach(async () => {
      const integrations = await testHelper.findAllIntegrations();

      return testHelper.deleteIntegrations(integrations);
    });

    it('should create a default integration', async () => {
      await testHelper.createIntegration();

      const integrations = await testHelper.findAllIntegrations();

      assert.equal(integrations.length, 1);
      assert.equal(integrations[0].name, testHelper.DEFAULT_INTEGRATION.name);
      assert.equal(integrations[0].token, testHelper.DEFAULT_INTEGRATION.token);
    });

    it('should create an integration with provided params', async () => {
      await testHelper.createIntegration({ name: 'providedName', token: 'providedToken' });

      const integrations = await testHelper.findAllIntegrations();

      assert.equal(integrations.length, 1);
      assert.equal(integrations[0].name, 'providedName');
      assert.equal(integrations[0].token, 'providedToken');
    });

    it('should throw an exception during creation', async () => {
      const promise = testHelper.createIntegration({ title: 'providedName', token: 'providedToken' });

      assert.isRejected(promise, /notNull Violation: name cannot be null/, 'failed');

      const integrations = await testHelper.findAllIntegrations();

      return assert.equal(integrations.length, 0);
    });
  });

  describe('createNetworks', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();
      const integrations = await testHelper.findAllIntegrations();
      return Promise.all([
        testHelper.deleteIntegrations(integrations),
        testHelper.deleteUsers(users),
      ]);
    });

    it('should create 2 networks', async () => {
      const user = await testHelper.createUser(blueprints.users.admin);

      await Promise.all([
        testHelper.createNetwork({ userId: user.id }),
        testHelper.createNetwork({
          userId: user.id,
          externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
        }),
      ]);

      const networks = await testHelper.findAllNetworks();

      assert.equal(networks.length, 2);
    });

    it('should create a network with an integration', async () => {
      const user = await testHelper.createUser(blueprints.users.admin);
      const integration = await testHelper.createIntegration()
      const createdNetworks = await Promise.all([
        testHelper.createNetwork({
          userId: user.id,
          externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
          integrationName: testHelper.DEFAULT_INTEGRATION.name,
        }),
      ]);

      const integrationName = await networkRepo.findIntegrationNameForNetwork(createdNetworks[0].id);
      const networks = await networkService.listNetworksForIntegration({ integrationName: testHelper.DEFAULT_INTEGRATION.name });

      assert.equal(networks.length, 1);
      assert.equal(integrationName, testHelper.DEFAULT_INTEGRATION.name);
      assert.equal(networks[0].id, createdNetworks[0].id);
    });

    it('should create a network with a custom networkName', async () => {
      const user = await testHelper.createUser(blueprints.users.admin);
      const integration = await testHelper.createIntegration()
      const createdNetworks = await Promise.all([
        testHelper.createNetwork({
          userId: user.id,
          externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
          name: 'customName',
          integrationName: testHelper.DEFAULT_INTEGRATION.name,
        }),
      ]);

      const integrationName = await networkRepo.findIntegrationNameForNetwork(createdNetworks[0].id);
      const networks = await networkService.listNetworksForIntegration({ integrationName: testHelper.DEFAULT_INTEGRATION.name });

      assert.equal(networks.length, 1);
      assert.equal(networks[0].name, 'customName');
    });
  });
  describe('authenticateUser', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();

      return testHelper.deleteUsers(users);
    });

    it('should authenticate a user', async () => {
      const user = await testHelper.createUser(blueprints.users.employee);
      const network = await testHelper.createNetwork({ userId: user.id, name: 'NetworkForAuthenticatedUser' });

      await testHelper.addUserToNetwork({
        userId: user.id,
        networkId: network.id,
        roleType: UserRoles.ADMIN,
      });

      const authUser = await testHelper.authenticateUser({
        username: blueprints.users.employee.username,
        password: blueprints.users.employee.password,
        deviceName: 'foo',
      });

      assert.isNotNull(authUser);
      assert.property(authUser, 'token');
    });
  });
});
