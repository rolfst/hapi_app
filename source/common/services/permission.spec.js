import { assert } from 'chai';
import { hasRole } from 'common/services/permission';

describe('Service: permission', () => {
  it('check if role matches', () => {
    assert.equal(hasRole({ scope: 'Foo' }, 'Foo'), true);
    assert.equal(hasRole({ scope: 'Foo' }, 'Bar'), false);
  });
});
