import { assert } from 'chai';
import networkHasIntegration from 'common/utils/network-has-integration';

describe('networkHasIntegration', () => {
  it('should check if network has integrations', () => {
    assert.equal(networkHasIntegration(global.network), false);
    assert.equal(networkHasIntegration(global.pmtNetwork), true);
  });
});
