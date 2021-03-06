const { assert } = require('chai');
const sinon = require('sinon');
const R = require('ramda');
const Promise = require('bluebird');
const password = require('../../../../shared/utils/password');
const userRepo = require('../../../core/repositories/user');
const unit = require('./implementation');

describe('Authentication service', () => {
  const credentials = {
    username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
  };

  describe('authenticateUser', () => {
    before(() => {
      sinon.stub(userRepo, 'findCredentialsForUser').returns(Promise.resolve({
        username: credentials.username,
        password: password.make(credentials.password),
      }));
    });

    after(() => userRepo.findCredentialsForUser.restore());

    it('check if credentials match', async () => {
      sinon.stub(unit, 'checkPassword').returns(true);
      const authenticationCredentials = await unit.authenticateUser(credentials);
      unit.checkPassword.restore();

      assert.equal(authenticationCredentials.username, credentials.username);
    });

    it('should fail when credentials do not match', async () => {
      sinon.stub(unit, 'checkPassword').returns(false);
      const authenticationPromise = unit.authenticateUser(R.merge(
        credentials, { password: 'ihaznoswag' }));
      unit.checkPassword.restore();

      return assert.isRejected(authenticationPromise);
    });
  });

  describe('checkPassword', () => {
    it('return true when password match', () => {
      const plainPassword = 'foo';
      const hashedPassword = password.make(plainPassword);

      const actual = unit.checkPassword(hashedPassword, plainPassword);
      assert.equal(actual, true);
    });

    it('return false when password do not match', () => {
      const plainPassword = 'foo';
      const hashedPassword = password.make('baz');

      const actual = unit.checkPassword(hashedPassword, plainPassword);
      assert.equal(actual, false);
    });
  });
});
