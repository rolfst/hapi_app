import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import { putRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Update exchange', () => {
  let admin;
  let network;
  let exchange;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    exchange = await createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to update',
    });
  });

  after(() => testHelper.cleanAll());

  it('should return updated attributes', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = {
      title: 'New title',
      description: 'New description',
      start_time: moment().toISOString(),
      end_time: moment().add(2, 'hours').toISOString(),
    };

    const { result: { data } } = await putRequest(endpoint, payload, admin.token);

    assert.equal(data.title, 'New title');
    assert.equal(data.description, 'New description');
    assert.isTrue(moment(data.start_time).isSame(payload.start_time, 'minute'));
    assert.isTrue(moment(data.end_time).isSame(payload.end_time, 'minute'));
  });

  it('should fail when end_time is defined without defining start_time', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = {
      end_time: moment().add(2, 'hours').toISOString(),
    };

    const { statusCode } = await putRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 422);
  });

  it('should fail when end_time is before start_time', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const payload = {
      start_time: moment().toISOString(),
      end_time: moment().subtract(2, 'hours').toISOString(),
    };

    const { statusCode } = await putRequest(endpoint, payload, admin.token);

    assert.equal(statusCode, 422);
  });
});
