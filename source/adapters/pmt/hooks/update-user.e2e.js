import { assert } from 'chai';
import _ from 'lodash';
import fetchUsersHook from 'adapters/pmt/hooks/fetch-users';
import { putRequest } from 'common/test-utils/request';

let endpoint;

describe('PMT: Update User', () => {
  it('should return correct data', async () => {
    endpoint = `/v2/networks/${global.pmtNetwork.id}/users/me`;

    await putRequest(endpoint, { email: 'pmt-hodor@flex-appeal.nl' });
    const result = await fetchUsersHook(global.pmtNetwork.externalId);

    const externalId = _.find(global.authIntegrations, { name: 'PMT' }).externalId;
    const actual = _.find(result, { id: externalId });

    assert.equal(actual.email, 'pmt-hodor@flex-appeal.nl');
  });

  after(() => {
    return putRequest(endpoint, { email: 'ruben@flex-appeal.nl' });
  });
});
