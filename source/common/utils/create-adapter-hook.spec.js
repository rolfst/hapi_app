import { assert } from 'chai';
import createAdapterHook from 'common/utils/create-adapter-hook';

describe('createAdapterHook', () => {
  it('should decorate adapter with token', () => {
    const stub = token => () => token;
    const token = 'test_token';
    const actual = createAdapterHook(stub)(token)();

    assert.equal(actual, token);
  });
});
