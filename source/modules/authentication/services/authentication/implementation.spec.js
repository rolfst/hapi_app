import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import blueprints from 'shared/test-utils/blueprints';
import * as password from 'shared/utils/password';
import * as userRepo from 'shared/repositories/user';
import * as checkPassword from 'modules/authentication/utils/check-password';
import * as unit from 'modules/authentication/services/authentication/implementation';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('Authentication service', () => {
  describe('authenticateUser', () => {
    it('check if credentials match', async () => {
      sinon.stub(userRepo, 'findUserByUsername').returns(Promise.resolve({
        username: credentials.username,
        password: password.make(credentials.password),
      }));

      const stub = sinon.stub(checkPassword, 'default').returns(true);

      const actual = await unit.authenticateUser(credentials);
      assert.equal(actual.username, credentials.username);

      stub.restore();
    });

    it('it should fail when credentials do not match', async () => {
      const stub = sinon.stub(checkPassword, 'default').returns(false);
      const promise = unit.authenticateUser({ ...credentials, password: 'ihaznoswag' });
      stub.restore();

      return assert.isRejected(promise);
    });
  });

  describe('authenticateIntegrations', () => {
    it('should fail when there is no adapter found', () => {
      const stubbedPromises = [
        Promise.resolve('foo'),
        Promise.reject('bar'),
        Promise.reject('baz'),
        Promise.resolve('qaz'),
      ];

      const actual = unit.authenticateIntegrations(blueprints.users.admin, stubbedPromises);

      return assert.eventually.deepEqual(actual, ['foo', 'qaz']);
    });
  });

  describe('mapNetworkAndToken', () => {
    it('should return correct integration token for network', () => {
      const fakeNetwork = {
        name: 'My network',
        Integrations: [{
          name: 'INTEGRATION_NAME',
        }],
      };

      const fakeAuthenticatedIntegrations = [{
        name: 'INTEGRATION_NAME',
        token: 'cool_token',
      }];

      const actual = unit.mapNetworkAndToken(fakeNetwork, fakeAuthenticatedIntegrations);
      const expected = { network: fakeNetwork, token: 'cool_token' };

      assert.deepEqual(actual, expected);
    });
  });
});
