import { assert } from 'chai';
import networkHasIntegration from 'common/utils/network-has-integration';

describe('networkHasIntegration', () => {
  it('should check if network has integrations', () => {
    assert.equal(networkHasIntegration(global.networks.flexAppeal), false);
    assert.equal(networkHasIntegration(global.networks.pmt), true);
  });
});
