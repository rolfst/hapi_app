import { assert } from 'chai';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as integrationRepo from './integration';

describe('Integration repository', () => {
  after(() => testHelper.cleanAll());

  it('should create and fetch all integrations', async () => {
    const count = (await integrationRepo.findAll()).length;
    const integration = await integrationRepo.createIntegration({
      name: 'integrationRepoTestName',
      token: 'testToken' });
    const updatedCount = (await integrationRepo.findAll()).length;

    await integrationRepo.deleteById(integration.id);

    assert.equal(updatedCount, count + 1);
  });
});
