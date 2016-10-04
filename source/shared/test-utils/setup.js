import 'babel-polyfill';
import chai from 'chai';
import nock from 'nock';
import sinon from 'sinon';
import dotenv from 'dotenv';
import * as mailer from '../services/mailer';
import notifier from '../services/notifier';
import createServer from '../../server';
import blueprints from './blueprints';
import { UserRoles } from '../services/permission';
import { createUser } from '../../modules/core/repositories/user';
import authenticate from './authenticate';
import * as accessService from '../../modules/integrations/services/access';
import { createNetwork, createIntegrationNetwork } from '../../modules/core/repositories/network';
import generateNetworkName from './create-network-name';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
dotenv.config();

global.server = createServer(8000);

let admin;
let employee;
let networklessUser;

before(async () => {
  [admin, employee, networklessUser] = await Promise.all([
    createUser(blueprints.users.admin),
    createUser(blueprints.users.employee),
    createUser(blueprints.users.networkless),
  ]);

  // Create networks
  const [createdFlexNetwork, createdPMTNetwork] = await Promise.all([
    createNetwork(admin.id, generateNetworkName()),
    createIntegrationNetwork({
      userId: admin.id,
      externalId: 'https://partner2.testpmt.nl/rest.php/jumbowolfskooi',
      name: generateNetworkName(),
      integrationName: 'PMT',
    }),
  ]);

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
    .reply(200, { logged_in_user_token: '379ce9b4176cb89354c1f74b3a2c1c7a', user_id: 8023 });

  // Add user to the networks
  await Promise.all([
    createdFlexNetwork.addUser(admin, { roleType: UserRoles.ADMIN }),
    createdFlexNetwork.addUser(employee, { roleType: UserRoles.EMPLOYEE }),
    createdPMTNetwork.addUser(admin, {
      roleType: UserRoles.ADMIN,
      externalId: 8023,
      userToken: '379ce9b4176cb89354c1f74b3a2c1c7a',
    }),
  ]);

  // Reload networks to include added users
  const [flexAppealNetwork, pmtNetwork] = await Promise.all([
    createdFlexNetwork.reload(),
    createdPMTNetwork.reload(),
  ]);

  const [newAdmin, newEmployee] = await Promise.all([
    admin.reload(),
    employee.reload(),
  ]);

  const employeeAuth = await authenticate(global.server, employeeCredentials);

  const message = { credentials: admin, network: createdPMTNetwork, deviceName: 'foo' };
  const linkedAdminToken = await accessService.getLinkedAccessToken(adminCredentials, message);

  global.users = {
    admin: newAdmin,
    employee: newEmployee,
    networklessUser,
  };

  global.tokens = {
    admin: linkedAdminToken,
    employee: employeeAuth.token,
  };

  global.networks = {
    flexAppeal: flexAppealNetwork,
    pmt: pmtNetwork,
  };

  // Disable specific services when testing
  sinon.stub(notifier, 'send').returns(null);
  sinon.stub(mailer, 'send').returns(null);
});

afterEach(() => nock.cleanAll());

after(async () => {
  await Promise.all([networklessUser.destroy(), employee.destroy()]);

  return admin.destroy();
});
