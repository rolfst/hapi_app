import { assert } from 'chai';
import networkHasIntegration from 'common/utils/network-has-integration';

describe('networkHasIntegration', () => {
  it('should check if network has integrations', () => {
    const networkFixtureWithoutIntegrations = {
      name: 'Flex-Appeal',
      Integrations: [],
    };

    const networkFixtureWithIntegrations = {
      name: 'PMT',
      Integrations: [{
        foo: 'baz',
      }],
    };

    assert.equal(networkHasIntegration(networkFixtureWithoutIntegrations), false);
    assert.equal(networkHasIntegration(networkFixtureWithIntegrations), true);
  });
});
