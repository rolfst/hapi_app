import { assert } from 'chai';
import sinon from 'sinon';
import { getRequest } from '../../../shared/test-utils/request';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as eventRepo from '../repositories/event';

describe('created messages', () => {
  let sandbox;
  let network;
  let admin;

  before(async() => {
    admin = await testHelper.createUser({ password: 'foo' });
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexAppeal' });
    sandbox = sinon.sandbox.create();
  });

  after(() => {
    sandbox.restore();
    return testHelper.cleanAll();
  });

  it('should return a createdMessages statistic', async () => {
    sandbox.stub(eventRepo, 'findAllBy').returns(Promise.resolve({ payload: {} }));
    const endpoint = `/v2/networks/${network.id}/statistics/created-messages`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
  });
});
