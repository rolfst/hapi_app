/* global assert */
import R from 'ramda';
import { first } from 'lodash';
import Promise from 'bluebird';
import blueprints from './blueprints';
import { UserRoles } from '../services/permission';
import * as networkRepo from '../../modules/core/repositories/network';
import * as integrationRepo from '../../modules/core/repositories/integration';
import * as networkService from '../../modules/core/services/network';
import * as userRepo from '../../modules/core/repositories/user';
import * as testHelper from './helpers';

describe('test helper', () => {
  describe('createUser', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();

      return testHelper.deleteUser(users);
    });

    it('should create a user', async () => {
      const createdUser = await testHelper.createUser({
        username: 'testHelper',
        firstName: 'test',
        lastName: 'Helper',
        email: 'testHelper@flex-appeal.nl',
        password: 'password',
      });

      const users = await testHelper.findAllUsers();
      const user = first(users);

      assert.equal(users.length, 1);
      assert.equal(user.username, 'testhelper');
      assert.equal(user.username, createdUser.username);
      assert.equal(user.firstName, 'test');
      assert.equal(user.firstName, createdUser.firstName);
      assert.equal(user.lastName, 'Helper');
      assert.equal(user.lastName, createdUser.lastName);
      assert.equal(user.email, 'testhelper@flex-appeal.nl');
      assert.equal(user.email, createdUser.email);
      assert.property(createdUser, 'token');
    });
  });

  describe('createIntegration', () => {
    afterEach(async () => {
      const integrations = await testHelper.findAllIntegrations();

      return testHelper.deleteIntegration(integrations);
    });

    it('should create a default integration', async () => {
      const integration = await testHelper.createIntegration();

      const integrations = await testHelper.findAllIntegrations();
      assert.equal(integrations.length, 1);
      assert.equal(integrations[0].name, integration.name);
      assert.equal(integrations[0].token, integration.token);
    });

    it('should create an integration with provided params', async () => {
      await testHelper.createIntegration({ name: 'providedName', token: 'providedToken' });

      const integrations = await testHelper.findAllIntegrations();

      assert.equal(integrations.length, 1);
      assert.equal(integrations[0].name, 'providedName');
      assert.equal(integrations[0].token, 'providedToken');
    });

    it('should throw an exception during creation', async () => {
      const promise = testHelper.createIntegration({
        title: 'providedName', token: 'providedToken' });

      assert.isRejected(promise, /notNull Violation: name cannot be null/, 'failed');

      const integrations = await testHelper.findAllIntegrations();

      return assert.equal(integrations.length, 0);
    });
  });

  describe('createNetworks', () => {
    afterEach(async () => testHelper.cleanAll());

    it('should create 2 networks', async () => {
      const user = await testHelper.createUser({ password: 'test' });

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
      const user = await testHelper.createUser({ password: 'test' });
      const createdIntegration = await testHelper.createIntegration();
      const createdNetwork = await testHelper.createNetwork({
        userId: user.id,
        externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
        integrationName: testHelper.DEFAULT_INTEGRATION.name,
      });

      const network = await networkService.getNetwork({
        networkId: createdNetwork.id }, { credentials: { id: user.id } });
      const integrations = await integrationRepo.findAll();
      const integration = R.find(R.propEq('name', testHelper.DEFAULT_INTEGRATION.name),
          integrations);
      const foundIntegration = R.find((integrationName) => integrationName === integration.name,
          network.integrations);

      assert.equal(foundIntegration, createdIntegration.name);
      assert.equal(network.id, createdNetwork.id);
    });

    it('should create a network with a custom networkName', async () => {
      const user = await testHelper.createUser({ password: 'test' });
      await testHelper.createIntegration();
      const createdNetwork = await testHelper.createNetwork({
        userId: user.id,
        externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
        name: 'customName',
        integrationName: testHelper.DEFAULT_INTEGRATION.name,
      });

      const network = await networkService.getNetwork({
        networkId: createdNetwork.id }, { credentials: { id: user.id } });

      assert.equal(network.name, 'customName');
    });
  });

  describe('createNetworkWithIntegration', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();
      const integrations = await testHelper.findAllIntegrations();
      return Promise.all([
        testHelper.deleteIntegration(integrations),
        testHelper.deleteUser(users),
      ]);
    });

    it('should create both a network and an integration', async () => {
      const integrationName = 'integration';
      const user = await testHelper.createUser({ password: 'test' });
      const { network, integration } = await testHelper.createNetworkWithIntegration({
        userId: user.id,
        externalId: 'externalId',
        name: 'networkName',
        integrationName,
        integrationToken: 'testToken',
      });

      assert.isNotNull(network);
      assert.isNotNull(integration);
      assert.equal(network.integrations[0], integration.name);
      assert.equal(integration.name, integrationName);
    });
  });

  describe('createUserForNewNetwork', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();

      return testHelper.deleteUser(users);
    });

    it('should create a user connected to a network', async () => {
      const { user, network } = await testHelper.createUserForNewNetwork(
        blueprints.users.employee, { name: 'pmt' });
      const users = await networkRepo.findAllUsersForNetwork(network.id);

      assert.isNotNull(user);
      assert.isNotNull(network);
      assert.equal(user.id, users[0].id);
    });
  });

  describe('authenticateUser', () => {
    afterEach(async () => {
      const users = await testHelper.findAllUsers();

      return testHelper.deleteUser(users);
    });

    it('should authenticate a user', async () => {
      const user = await testHelper.createUser(blueprints.users.employee);
      const network = await testHelper.createNetwork({
        userId: user.id, name: 'NetworkForAuthenticatedUser' });

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

  describe('cleanAll', () => {
    it('should clean the whole database', async () => {
      const admin = await testHelper.createUser(blueprints.users.admin);
      const employee = await testHelper.createUser(blueprints.users.employee);
      const network = await testHelper.createNetwork({
        userId: admin.id, name: 'NetworkForAuthenticatedUser' });

      await testHelper.addUserToNetwork({
        userId: admin.id,
        networkId: network.id,
        roleType: UserRoles.ADMIN,
      });

      await testHelper.addUserToNetwork({
        userId: employee.id,
        networkId: network.id,
        roleType: UserRoles.EMPLOYEE,
      });

      await testHelper.cleanAll();
      const networks = await testHelper.findAllNetworks();
      const users = await testHelper.findAllUsers();
      const integrations = await testHelper.findAllIntegrations();

      assert.equal(networks.length, 0);
      assert.equal(users.length, 0);
      assert.equal(integrations.length, 0);
    });
  });
});
