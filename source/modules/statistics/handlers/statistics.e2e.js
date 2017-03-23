const { assert } = require('chai');
const sinon = require('sinon');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelper = require('../../../shared/test-utils/helpers');
const Mixpanel = require('../../../shared/services/mixpanel');

describe('Handler: Statistics', () => {
  let sandbox;
  let network;
  let admin;

  before(async () => {
    admin = await testHelper.createUser({ password: 'foo' });
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    sandbox = sinon.sandbox.create();
    sandbox.stub(Mixpanel, 'executeQuery').returns(Promise.resolve({ payload: {} }));
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('should accept created_messages view', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics/created_messages`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });

  it('should accept created_shifts view', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics/created_shifts`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });

  it('should fail when view is not found', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics/wrong_view`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 422);
  });
});
