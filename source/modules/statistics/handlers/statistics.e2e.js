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

  it('should accept created_messages view with user type', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics?q=created_messages&type=user`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });
  it('should accept created_messages view with team type', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics?q=created_messages&type=team`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });

  it('should accept created_shifts view', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics?q=created_shifts&type=user`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });
  it('should not accept created_shifts view with wrong type', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics?q=created_shifts&type=team`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should accept approved_shifts view', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics?q=approved_shifts&type=user`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });
  it('should not accept approved_shifts view with wrong type', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics?q=approved_shifts&type=team`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when view is not found', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics/wrong_view`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 404);
  });
});
