import Promise from 'bluebird';
import blueprints from './blueprints';
import generateNetworkName from './create-network-name';
import * as userRepo from '../../modules/core/repositories/user';
import * as networkRepo from '../../modules/core/repositories/network';
import * as integrationRepo from '../../modules/core/repositories/integration';
import * as networkService from '../../modules/core/services/network';
import * as testHelper from './helpers';

describe('test helper', () => {
  describe('createIntegration', () => {
    afterEach(async () => {
      const integrations = await integrationRepo.findAll();

      return Promise.each(integrations, (integration) => integrationRepo.deleteById(integration.id));
    });

    it('should create a default integration', async () => {
      await testHelper.createIntegration();

      const integrations = await integrationRepo.findAll();

      assert.equal(integrations.length, 1);
      assert.equal(integrations[0].name, testHelper.DEFAULT_INTEGRATION.name);
      assert.equal(integrations[0].token, testHelper.DEFAULT_INTEGRATION.token);
    });
    it('should create an integration with provided params', async () => {
      await testHelper.createIntegration({ name: 'providedName', token: 'providedToken' });

      const integrations = await integrationRepo.findAll();

      assert.equal(integrations.length, 1);
      assert.equal(integrations[0].name, 'providedName');
      assert.equal(integrations[0].token, 'providedToken');
    });
    it('should throw an exception during creation', async () => {
      const promise = testHelper.createIntegration({ title: 'providedName', token: 'providedToken' });

      assert.isRejected(promise, /notNull Violation: name cannot be null/, 'failed');

      const integrations = await integrationRepo.findAll();

      return assert.equal(integrations.length, 0);
    });
  });

  describe('createNetworks', () => {
    afterEach(async () => {
      const users = await userRepo.findAllUsers();
      const integrations = await integrationRepo.findAll();
      return Promise.all([
        Promise.map(integrations, (integration) => integrationRepo.deleteById(integration.id)),
        Promise.map(users, (user) => userRepo.deleteById(user.id)),
      ]);
    });

    it('should create 2 networks', async () => {
      const user = await userRepo.createUser(blueprints.users.admin);

      await Promise.all([
        testHelper.createNetwork({ userId: user.id, name: generateNetworkName() }),
        testHelper.createNetwork({
          userId: user.id,
          externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
          name: generateNetworkName(),
        }),
      ]);

      const networks = await networkRepo.findAll();

      assert.equal(networks.length, 2);
    });
    it('should create a network with an integration', async () => {
      const user = await userRepo.createUser(blueprints.users.admin);
      const integration = await testHelper.createIntegration()
      const createdNetworks = await Promise.all([
        testHelper.createNetwork({
          userId: user.id,
          externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
          name: generateNetworkName(),
          integrationName: testHelper.DEFAULT_INTEGRATION.name,
        }),
      ]);

      const integrationName = await networkRepo.findIntegrationNameForNetwork(createdNetworks[0].id);
      const networks = await networkService.listNetworksForIntegration({ integrationName: testHelper.DEFAULT_INTEGRATION.name });

      assert.equal(networks.length, 1);
      assert.equal(integrationName, testHelper.DEFAULT_INTEGRATION.name);
      assert.equal(networks[0].id, createdNetworks[0].id);
    });
  });
});
