import { assert } from 'chai';
import sinon from 'sinon';
import bcrypt from 'bcrypt';
import * as password from './password';

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
