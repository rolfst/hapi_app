import { assert } from 'chai';
import sinon from 'sinon';
import { map } from 'lodash';
import * as passwordUtil from '../../../shared/utils/password';
import * as notifier from '../../../shared/services/notifier';
import * as mailer from '../../../shared/services/mailer';
import signupMail from '../../../shared/mails/signup';
import * as userRepo from '../../core/repositories/user';
import * as userService from '../../core/services/user';
import * as service from './invite-user';
import * as impl from './implementation';

describe('Invite users', () => {
  let sandbox;

  const aUser = {
    id: '1',
    username: 'importTestUser@flex-appeal.nl',
    email: 'importTestUser@flex-appeal.nl',
    password: 'testpassword',
    firstName: 'import',
  };
  const invitedUser = {
    id: '2',
    username: 'importedTestUser@flex-appeal.nl',
    email: 'importedTestUser@flex-appeal.nl',
    password: 'testpassword',
    firstName: 'imported',
    invitedAt: new Date(),
  };
  const adminUser = {
    id: '3',
    username: 'adminUser@flex-appeal.nl',
    firstName: 'admin',
    password: 'testpassword',
    roleType: 'ADMIN',
  };
  const allUsersFromIntegration = [aUser, invitedUser, adminUser];
  const network = { id: '1',
      superAdmin: { firstName: 'admin' },
      integrations: ['PMT'],
    };
  const message = {
    credentials: { id: '3' },
    network,
  };

  before(() => (sandbox = sinon.sandbox.create()));
  after(() => sandbox.restore());

  it('should send correct emails', async () => {
    const fakeAdapter = { fetchUsers: () => allUsersFromIntegration };

    sandbox.stub(notifier, 'send').returns(null);
    sandbox.stub(mailer, 'send').returns(null);
    sandbox.stub(userRepo, 'userBelongsToNetwork').returns(Promise.resolve(true));
    sandbox.stub(userService, 'getUserWithNetworkScope').returns(Promise.resolve(adminUser));
    sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
    sandbox.stub(impl, 'generatePasswordsForMembers', users => {
      return users;
    });
    sandbox.stub(userRepo, 'setNetworkLink').returns(Promise.resolve({
      userId: '1', networkId: network.Id, invitedAt: new Date() }));
    sandbox.stub(userService, 'listUsersWithNetworkScope')
      .returns(Promise.resolve(allUsersFromIntegration));

    const passwordMailConfig = signupMail(message.network, aUser);
    const noPasswordMailAdminConfig = signupMail(message.network, adminUser);
    const noPasswordMailConfig = signupMail(message.network, invitedUser);
    const userIdsToNotify = map(allUsersFromIntegration, user => user.id);

    await service.inviteUsers({ userIds: userIdsToNotify, networkId: network.id }, message);

    assert.equal(mailer.send.calledWithMatch(passwordMailConfig), true);
    assert.equal(mailer.send.calledWithMatch(noPasswordMailConfig), false);
    assert.equal(mailer.send.calledWithMatch(noPasswordMailAdminConfig), true);
  });
});
