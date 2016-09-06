import { assert } from 'chai';
import * as unit from 'modules/authentication/utils/integration-tokens-for-user';

describe('integrationTokensForUser', () => {
  it('transform result into integration objects', async () => {
    const user = {
      Networks: [{
        Integrations: [{
          name: 'foo',
        }],
        NetworkUser: {
          externalId: 1337,
          userToken: 'my_token',
        },
      }],
    };

    const actual = await unit.getIntegrationTokensForUser(user);
    const expected = [{ name: 'foo', token: 'my_token', externalId: 1337 }];

    assert.deepEqual(actual, expected);
  });
});
