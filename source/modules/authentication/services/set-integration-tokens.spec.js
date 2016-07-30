import { assert } from 'chai';
import * as service from 'modules/authentication/services/set-integration-tokens';

describe('mapNetworkAndToken', () => {
  it('should return correct integration token for network', () => {
    const fakeNetwork = {
      name: 'My network',
      Integrations: [{
        name: 'INTEGRATION_NAME',
      }],
    };

    const fakeAuthenticatedIntegrations = [{
      name: 'INTEGRATION_NAME',
      token: 'cool_token',
    }];

    const actual = service.mapNetworkAndToken(fakeNetwork, fakeAuthenticatedIntegrations);
    const expected = { network: fakeNetwork, token: 'cool_token' };

    assert.deepEqual(actual, expected);
  });
});
