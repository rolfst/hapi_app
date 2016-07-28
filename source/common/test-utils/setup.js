import 'babel-polyfill';
import chai from 'chai';
import sinon from 'sinon';
import dotenv from 'dotenv';
import createServer from 'server';
import Parse from 'parse/node';
import * as mailer from 'common/services/mailer';
import blueprints from 'common/test-utils/blueprints';
import { roles } from 'common/services/permission';
import { createUser } from 'common/repositories/user';
import authenticate from 'common/test-utils/authenticate';
import { createNetwork, createPmtNetwork } from 'common/repositories/network';
import generateNetworkName from 'common/test-utils/create-network-name';

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
dotenv.config();

global.server = createServer(8000);

let admin;
let employee;
let networklessUser;

before(async () => {
  try {
    [admin, employee, networklessUser] = await Promise.all([
      createUser(blueprints.users.admin),
      createUser(blueprints.users.employee),
      createUser(blueprints.users.networkless),
    ]);

    // Create networks
    const [createdFlexNetwork, createdPMTNetwork] = await Promise.all([
      createNetwork(admin.id, generateNetworkName()),
      createPmtNetwork(admin.id, generateNetworkName()),
    ]);

    // Add user to the networks
    await Promise.all([
      createdFlexNetwork.addUser(admin, { roleType: roles.ADMIN }),
      createdFlexNetwork.addUser(employee, { roleType: roles.EMPLOYEE }),
      createdPMTNetwork.addUser(admin, {
        roleType: roles.ADMIN,
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

    const adminCredentials = blueprints.users.admin;
    const adminAuth = await authenticate(global.server, {
      username: adminCredentials.username,
      password: adminCredentials.password,
    });

    const employeeCredentials = blueprints.users.employee;
    const employeeAuth = await authenticate(global.server, {
      username: employeeCredentials.username,
      password: employeeCredentials.password,
    });

    global.users = {
      admin: newAdmin,
      employee: newEmployee,
      networklessUser,
    };

    global.tokens = {
      admin: adminAuth.token,
      employee: employeeAuth.token,
    };

    global.integrations = {
      admin: adminAuth.integrations,
      employee: employeeAuth.integrations,
    };

    global.networks = {
      flexAppeal: flexAppealNetwork,
      pmt: pmtNetwork,
    };

    // Disable Parse send when testing
    sinon.stub(Parse.Push, 'send').returns(null);

    // Disble mailing when testing
    sinon.stub(mailer, 'send').returns(null);
  } catch (err) {
    console.log('Error in test setup', err);
  }
});

after(() => Promise.all([
  admin.destroy(),
  employee.destroy(),
  networklessUser.destroy(),
]).catch(err => console.log('Error in test teardown', err)));
