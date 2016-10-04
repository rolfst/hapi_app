import { assert } from 'chai';
import { hasRole } from './permission';

describe('Permission', () => {
  it('check if role matches', () => {
    assert.equal(hasRole({ role: 'Foo' }, 'Foo'), true);
    assert.equal(hasRole({ role: 'Foo' }, 'Bar'), false);
  });
});
