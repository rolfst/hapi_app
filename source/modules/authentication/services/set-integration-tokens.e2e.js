import { assert } from 'chai';
import
  getIntegrationTokensForUser
from 'modules/authentication/utils/get-integration-tokens-for-user';
import systemUnderTest from 'modules/authentication/services/set-integration-tokens';

describe('setIntegrationTokens', () => {
  it('should return correct values', async () => {
    const user = global.users.admin;
    const authenticatedIntegrations = [{
      name: 'PMT',
      token: 'my_pmt_token',
    }];

    await systemUnderTest(user, authenticatedIntegrations);

    const reloadedUser = await user.reload();
    const actual = getIntegrationTokensForUser(reloadedUser);

    assert.equal(actual[0].token, 'my_pmt_token');
  });
});
