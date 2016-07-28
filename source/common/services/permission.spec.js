import { assert } from 'chai';
import { hasRole } from 'common/services/permission';

describe('Permission', () => {
  it('check if role matches', () => {
    assert.equal(hasRole({ scope: 'Foo' }, 'Foo'), true);
    assert.equal(hasRole({ scope: 'Foo' }, 'Bar'), false);
  });
});
