import { assert } from 'chai';
import * as repository from './network';

describe('Network Repository', () => {
  let networkWithIntegration;
  let networkWithoutIntegration;

  before(async () => {
    networkWithIntegration = await repository.createIntegrationNetwork({
      name: 'Network with integration',
      userId: global.users.admin.id,
      externalId: '123',
      integrationName: 'PMT',
    });

    networkWithoutIntegration = await repository.createNetwork(
      global.users.admin.id, 'Network without integration');
  });

  after(() => Promise.all([
    repository.deleteById(networkWithoutIntegration.id),
    repository.deleteById(networkWithIntegration.id),
  ]));

  describe('findIntegrationNameForNetwork', () => {
    it('should return the correct integration name', async () => {
      const actual = await repository.findIntegrationNameForNetwork(networkWithIntegration.id);

      assert.equal(actual, 'PMT');
    });

    it('should return null when network has no integration', async () => {
      const actual = await repository.findIntegrationNameForNetwork(networkWithoutIntegration.id);

      assert.equal(actual, null);
    });
  });
});
