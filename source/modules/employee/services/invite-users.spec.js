import { assert } from 'chai';
import sinon from 'sinon';
import * as userBelongsToNetwork from '../../../shared/utils/user-belongs-to-network';
import * as permission from '../../../shared/services/permission';
import * as passwordUtil from '../../../shared/utils/password';
import * as mailer from '../../../shared/services/mailer';
import * as networkUtil from '../../../shared/utils/network';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import addedToExtraNetworkMail from '../../../shared/mails/added-to-extra-network';
import * as createAdapter from '../../../shared/utils/create-adapter';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as service from './invite-user';

describe('Invite users', () => {
  let sandbox;

  const importUser = {
    username: 'importTestUser@flex-appeal.nl',
    plainPassword: 'testpassword',
    firstName: 'import',
  };
  const oldUser = {
    username: 'importedTestUser@flex-appeal.nl',
    firstName: 'imported',
    password: 'pass',
    plainPassword: 'testedpassword' };
  const adminUser = {
    username: 'adminUser@flex-appeal.nl',
    plainPassword: 'password',
    password: 'password',
    firstName: 'admin',
    roleType: 'ADMIN' };
  const allUsersFromIntegration = [importUser, oldUser, adminUser];
  const message = {
    credentials: { id: '' },
    network: { id: '',
      SuperAdmin: { firstName: 'admin' },
      Integrations: [{ name: 'PMT' }],
    },
  };

  before(() => (sandbox = sinon.sandbox.create()));
  after(() => sandbox.restore());

  it('should send correct emails', async () => {
    const fakeAdapter = { fetchUsers: () => allUsersFromIntegration };

    sandbox.stub(mailer, 'send');
    sandbox.stub(userRepo, 'findUserById').returns(Promise.resolve(adminUser));
    sandbox.stub(userRepo, 'updateUser').returns(Promise.resolve(importUser));
    sandbox.stub(networkUtil, 'addUserScope').returns(adminUser);
    sandbox.stub(createAdapter, 'default').returns(fakeAdapter);
    sandbox.stub(userBelongsToNetwork, 'default').returns(true);
    sandbox.stub(permission, 'isAdmin').returns(true);
    sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
    sandbox.stub(networkRepo, 'findActiveUsersForNetwork').returns(
      Promise.resolve(allUsersFromIntegration));

    const passwordMailConfig = addedToNetworkMail(message.network, importUser);
    const noPasswordMailAdminConfig = addedToExtraNetworkMail(message.network, adminUser);
    const noPasswordMailConfig = addedToExtraNetworkMail(message.network, oldUser);

    await service.inviteUsers({}, message);

    assert.equal(mailer.send.calledWithMatch(passwordMailConfig), true);
    assert.equal(mailer.send.calledWithMatch(noPasswordMailConfig), true);
    assert.equal(mailer.send.neverCalledWithMatch(noPasswordMailAdminConfig), true);
  });
});
