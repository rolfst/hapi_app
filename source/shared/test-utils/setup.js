import 'babel-polyfill';
import chai from 'chai';
import nock from 'nock';
import sinon from 'sinon';
import dotenv from 'dotenv';
import notifier from '../services/notifier';
import blueprints from './blueprints';
import stubs from './stubs';
import { UserRoles } from '../services/permission';
import * as accessService from '../../modules/integrations/services/access';
import * as networkService from '../../modules/core/services/network';
import * as userRepo from '../../modules/core/repositories/user';
import * as integrationRepo from '../../modules/core/repositories/integration';
import authenticate from './authenticate';
import generateNetworkName from './create-network-name';
import * as testHelper from './helpers';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
dotenv.config();

const createServer = require('../../server').default;
global.server = createServer(8000);

let admin;
let employee;
let networklessUser;
let integration;
let sandbox;

export const initialSetup = async () => {
  sandbox = sinon.sandbox.create();
  [admin, employee, networklessUser] = await Promise.all([
    userRepo.createUser(blueprints.users.admin),
    userRepo.createUser(blueprints.users.employee),
    userRepo.createUser(blueprints.users.networkless),
  ]);

  integration = await testHelper.createIntegration();

  // Create networks
  const [createdFlexNetwork, createdPMTNetwork] = await testHelper.createNetworks([
    { userId: admin.id, name: generateNetworkName() },
    {
      userId: admin.id,
      externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
      name: generateNetworkName(),
      integrationName: 'PMT',
  }]);

  const adminCredentials = {
    username: blueprints.users.admin.username,
    password: blueprints.users.admin.password,
  };

  const employeeCredentials = {
    username: blueprints.users.employee.username,
    password: blueprints.users.employee.password,
  };

  // Mocking this because we add integration settings to the JWT token
  // after the user can authenticate to the intergration.
  nock(createdPMTNetwork.externalId)
    .post('/login', adminCredentials)
    .reply(200, stubs.defaultLoggedinUser);

  // Add user to the networks
  await Promise.all([
    networkService.addUserToNetwork({
      networkId: createdFlexNetwork.id,
      userId: admin.id,
      roleType: UserRoles.ADMIN,
    }),
    networkService.addUserToNetwork({
      networkId: createdFlexNetwork.id,
      userId: employee.id,
      roleType: UserRoles.EMPLOYEE,
    }),
    networkService.addUserToNetwork({
      networkId: createdPMTNetwork.id,
      userId: admin.id,
      roleType: UserRoles.ADMIN,
      externalId: '8023',
      userToken: '379ce9b4176cb89354c1f74b3a2c1c7a',
    }),
  ]);

  const [adminAuth, employeeAuth] = await Promise.all([
    authenticate(global.server, adminCredentials),
    authenticate(global.server, employeeCredentials),
  ]);

  const message = { credentials: admin, network: createdPMTNetwork, deviceName: 'foo' };
  const linkedAdminToken = await accessService.getLinkedAccessToken(adminCredentials, message);

  global.users = {
    admin: adminAuth,
    employee: employeeAuth,
    networklessUser,
  };

  global.tokens = {
    admin: linkedAdminToken,
    employee: employeeAuth.token,
  };

  global.networks = {
    flexAppeal: createdFlexNetwork,
    pmt: createdPMTNetwork,
  };

  // Disable specific services when testing
  sandbox.stub(notifier, 'send').returns(null);
  nock.cleanAll();
};

export const finalCleanup = async () => {
  await Promise.all([
    userRepo.deleteById(networklessUser.id),
    userRepo.deleteById(employee.id),
    integrationRepo.deleteById(integration.id),
  ]);

  sandbox.restore();
  return userRepo.deleteById(admin.id);
};

// after(async () => finalCleanup());

// before(async () => initialSetup());

