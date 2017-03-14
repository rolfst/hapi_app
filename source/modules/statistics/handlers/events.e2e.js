import { assert } from 'chai';
import sinon from 'sinon';
import { getRequest } from '../../../shared/test-utils/request';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as Mixpanel from '../../../shared/services/mixpanel';

describe('Handler: created messages', () => {
  let sandbox;
  let network;
  let admin;

  before(async() => {
    admin = await testHelper.createUser({ password: 'foo' });
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    sandbox = sinon.sandbox.create();
    sandbox.stub(Mixpanel, 'executeQuery').returns(Promise.resolve({ payload: {} }));
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('should return a createdMessages statistic', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics/created_message`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });

  it('should return an error because of a wrong statistics view', async () => {
    const endpoint = `/v2/networks/${network.id}/statistics/created_messages`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 422);
  });
});
