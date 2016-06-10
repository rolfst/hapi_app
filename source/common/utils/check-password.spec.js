import { assert } from 'chai';
import checkPassword from 'common/utils/check-password';
import makePassword from 'common/utils/make-password';

describe('checkPassword', () => {
  it('return true when password match', () => {
    const plainPassword = 'foo';
    const hashedPassword = makePassword(plainPassword);

    const actual = checkPassword(hashedPassword, plainPassword);
    assert.equal(actual, true);
  });

  it('return false when password do not match', () => {
    const plainPassword = 'foo';
    const hashedPassword = makePassword('baz');

    const actual = checkPassword(hashedPassword, plainPassword);
    assert.equal(actual, false);
  });
});
