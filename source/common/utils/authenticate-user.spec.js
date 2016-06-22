import { assert } from 'chai';
import sinon from 'sinon';
import { createUser } from 'common/repositories/user';
import makePassword from 'common/utils/make-password';
import authenticateUser from 'common/utils/authenticate-user';
import WrongCredentials from 'common/errors/wrong-credentials';
import * as checkPassword from 'common/utils/check-password';
import * as userRepo from 'common/repositories/user';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('authenticateUser', () => {
  let user;

  before(() => createUser(credentials).then(createdUser => (user = createdUser)));
  after(() => user.destroy());

  it('return true when credentials do match', async () => {
    sinon.stub(userRepo, 'findUserByUsername').returns(Promise.resolve({
      username: credentials.username,
      password: makePassword(credentials.password),
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
