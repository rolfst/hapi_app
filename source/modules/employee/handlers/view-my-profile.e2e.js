import nock from 'nock';
import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';

describe('Authenticate', () => {
  before(() => {
    nock(global.networks.pmt.externalId)
      .post('/login')
      .reply(200, { logged_in_user_token: 'fake_token', user_id: 1 });
  });

  after(() => nock.restore());

  it('should return user object', async () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint);

    assert.equal(data.id, global.users.admin.id);
    assert.equal(data.integration_auth, false);
  });

  it('should return user object when authenticated with integration', async () => {
    const endpoint = `/v2/networks/${global.networks.pmt.id}/users/me`;
    const { result: { data } } = await getRequest(endpoint);

    assert.equal(data.id, global.users.admin.id);
    assert.equal(data.integration_auth, true);
  });
});
