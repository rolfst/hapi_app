import { assert } from 'chai';
import checkPassword from 'modules/authentication/utils/check-password';
import * as password from 'shared/utils/password';

describe('checkPassword', () => {
  it('return true when password match', () => {
    const plainPassword = 'foo';
    const hashedPassword = password.make(plainPassword);

    const actual = checkPassword(hashedPassword, plainPassword);
    assert.equal(actual, true);
  });

  it('return false when password do not match', () => {
    const plainPassword = 'foo';
    const hashedPassword = password.make('baz');

    const actual = checkPassword(hashedPassword, plainPassword);
    assert.equal(actual, false);
  });
});
