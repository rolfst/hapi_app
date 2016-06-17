import { assert } from 'chai';

describe('Setup', () => {
  it('should create Flex-Appeal network', () => {
    const integrations = global.network.Integrations;

    assert.lengthOf(integrations, 0);
  });

  it('should create PMT network', () => {
    const integrations = global.pmtNetwork.Integrations;

    assert.lengthOf(integrations, 1);
    assert.equal(integrations[0].name, 'PMT');
  });
});
