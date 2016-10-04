import { assert } from 'chai';
import sinon from 'sinon';
import Promise from 'bluebird';
import * as password from '../../../../shared/utils/password';
import * as userRepo from '../../../core/repositories/user';
import * as checkPassword from '../../utils/check-password';
import * as unit from './implementation';

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

    it('should fail when credentials do not match', async () => {
      const stub = sinon.stub(checkPassword, 'default').returns(false);
      const promise = unit.authenticateUser({ ...credentials, password: 'ihaznoswag' });
      stub.restore();

      return assert.isRejected(promise);
    });
  });

  describe('integrationTokensForUser', () => {
    it('transform result into integration objects', async () => {
      const user = {
        Networks: [{
          Integrations: [{
            name: 'foo',
          }],
          NetworkUser: {
            externalId: 1337,
            userToken: 'my_token',
          },
        }],
      };

      const actual = await unit.getIntegrationTokensForUser(user);
      const expected = [{ name: 'foo', token: 'my_token', externalId: 1337 }];

      assert.deepEqual(actual, expected);
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
