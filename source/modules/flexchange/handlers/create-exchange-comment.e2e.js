import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { postRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Create exchange comment', () => {
  let admin;
  let network;
  let exchange;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift 1 for network',
    });
  });

  after(() => testHelper.cleanAll());

  it('should create comment for exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/comments`;
    const payload = { text: 'New comment text' };
    const { result, statusCode } = await postRequest(endpoint, payload, admin.token);

    assert.equal(result.data.text, 'New comment text');
    assert.equal(result.data.user.id, admin.id);
    assert.equal(statusCode, 200);
  });
});
