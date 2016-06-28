import { assert } from 'chai';
import selectNetwork from 'common/utils/select-network';

describe('selectNetwork', () => {
  it('return the correct network', () => {
    const networks = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
    const actual = selectNetwork(networks, 2);

    assert.deepEqual(actual, { id: 2 });
  });
});
