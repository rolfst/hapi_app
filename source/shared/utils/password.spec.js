const { assert } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcrypt');
const password = require('./password');

describe('password', () => {
  it('should make password hash', () => {
    const stub = sinon.stub(bcrypt, 'hashSync').returns('foo');
    const actual = password.make('mypassword');

    assert.equal(stub.calledWith('mypassword'), true);
    assert.equal(actual, 'foo');
    stub.restore();
  });

  it('should replace hashed password', () => {
    const stub = sinon.stub(bcrypt, 'hashSync').returns('$2a$hashedpassword');
    const actual = password.make('mypassword');

    assert.equal(actual, '$2y$hashedpassword');
    stub.restore();
  });
});
