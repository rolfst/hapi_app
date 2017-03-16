const { assert } = require('chai');
const sinon = require('sinon');
const Promise = require('bluebird');
const R = require('ramda');
const mixpanel = require('mixpanel');
const Intercom = require('../../../shared/services/intercom');
const passwordUtil = require('../../../shared/utils/password');
const notifier = require('../../../shared/services/notifier');
const mailer = require('../../../shared/services/mailer');
const signupMail = require('../../../shared/mails/signup');
const userRepo = require('../../core/repositories/user');
const userService = require('../../core/services/user');
const networkRepo = require('../../core/repositories/network');
const service = require('./invite-user');
const impl = require('./implementation');

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

  describe('invite users', () => {
    before(() => (sandbox = sinon.sandbox.create()));
    after(() => sandbox.restore());

    it('should send correct emails', async () => {
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
      const userIdsToNotify = R.map(allUsersFromIntegration, user => user.id);

      await service.inviteUsers({ userIds: userIdsToNotify, networkId: network.id }, message);

      assert.equal(mailer.send.calledWithMatch(passwordMailConfig), true);
      assert.equal(mailer.send.calledWithMatch(noPasswordMailConfig), false);
      assert.equal(mailer.send.calledWithMatch(noPasswordMailAdminConfig), true);
    });
  });

  describe('invite user', () => {
    let peopleMock;

    before(() => {
      sandbox = sinon.sandbox.create();
      peopleMock = { set: sandbox.spy() };
      sandbox.stub(mixpanel, 'init').returns({ people: peopleMock });
      sandbox.stub(mailer, 'send').returns(null);
      sandbox.stub(Intercom, 'getClient').returns({ users: { create: () => true } });
      sandbox.stub(userRepo, 'userBelongsToNetwork').returns(Promise.resolve(true));
      sandbox.stub(userRepo, 'findUserBy').returns(Promise.resolve(false));
      sandbox.stub(userRepo, 'createUser').returns(Promise.resolve(false));
      sandbox.stub(networkRepo, 'addUser').returns(Promise.resolve(false));
      sandbox.stub(userService, 'getUserWithNetworkScope').returns(Promise.resolve(adminUser));
      sandbox.stub(passwordUtil, 'plainRandom').returns('testpassword');
    });

    after(() => sandbox.restore());

    it('should call mixpanel', async () => {
      await service.inviteUser(invitedUser, message);
      await Promise.delay(1000); // await because an event should be triggered async

      assert.equal(peopleMock.set.calledOnce, true);
    });
  });
});
