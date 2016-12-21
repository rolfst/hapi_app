import { assert } from 'chai';
import sinon from 'sinon';
import * as passwordUtil from '../../../shared/utils/password';
import * as mailer from '../../../shared/services/mailer';
import dispatchEvent from '../../../shared/services/dispatch-event';
import addedToNetworkMail from '../../../shared/mails/added-to-network';
import addedToExtraNetworkMail from '../../../shared/mails/added-to-extra-network';
import * as adapterUtil from '../../../shared/utils/create-adapter';
import * as userService from '../../core/services/user';
import * as networkRepo from '../../core/repositories/network';
import * as userRepo from '../../core/repositories/user';
import * as teamRepo from '../../core/repositories/team';
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
      superAdmin: { firstName: 'admin' },
      integrations: ['PMT'],
    },
  };

  before(() => (sandbox = sinon.sandbox.create()));
  after(() => sandbox.restore());

  it('should dispatch user invited event', async () => {
    sandbox.stub(userRepo, 'findUserByEmail').returns(Promise.resolve(importUser));
    sandbox.stub(service, 'inviteNewUser').returns(Promise.resolve(importUser));
    sandbox.stub(teamRepo, 'addUserToTeams').returns(Promise.resolve());
    sandbox.stub(userService, 'getUserWithNetworkScope').returns(Promise.resolve());
    sandbox.

    service.inviteUser(importUser, message);

    assert.equal()
  });

  it('should send correct emails', async () => {
    const fakeAdapter = { fetchUsers: () => allUsersFromIntegration };

    sandbox.stub(userRepo, 'userBelongsToNetwork').returns(Promise.resolve(true));
    sandbox.stub(userRepo, 'updateUser').returns(Promise.resolve(importUser));
    sandbox.stub(userService, 'getUserWithNetworkScope').returns(Promise.resolve(adminUser));
    sandbox.stub(adapterUtil, 'createAdapter').returns(fakeAdapter);
    sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
    sandbox.stub(networkRepo, 'findUsersForNetwork').returns(
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
