import { assert } from 'chai';
import sinon from 'sinon';
import * as password from 'common/utils/password';
import WrongCredentials from 'common/errors/wrong-credentials';
import * as checkPassword from 'modules/authentication/utils/check-password';
import * as userRepo from 'common/repositories/user';
import authenticateUser from 'modules/authentication/services/authenticate-user';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('authenticateUser', () => {
  it('check if credentials match', async () => {
    sinon.stub(userRepo, 'findUserByUsername').returns(Promise.resolve({
      username: credentials.username,
      password: password.make(credentials.password),
    }));

    const stub = sinon.stub(checkPassword, 'default').returns(true);

    const actual = await authenticateUser(credentials);
    assert.equal(actual.username, credentials.username);

    stub.restore();
  });

  it('it should fail when credentials do not match', async () => {
    const stub = sinon.stub(checkPassword, 'default').returns(false);
    const promise = authenticateUser({ ...credentials, password: 'ihaznoswag' });
    stub.restore();

    return assert.isRejected(promise, WrongCredentials);
  });
});
