import { assert } from 'chai';
import moment from 'moment';
import { patchRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../models/exchange';
import { createExchange } from '../repositories/exchange';

describe('Modify exchange', () => {
  let exchange;
  let expiredExchange;
  let network;

  before(async () => {
    network = global.networks.flexAppeal;

    exchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to check for modification',
    });

    expiredExchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().subtract(1, 'week').format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Expired shift to check for modification',
    });
  });

  after(() => Promise.all([exchange.destroy(), expiredExchange.destroy()]));

  it('should fail when action does not exist', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { statusCode } = await patchRequest(endpoint, { action: 'wrong_action' });

    assert.equal(statusCode, 422);
  });

  it('should fail when exchange is expired', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${expiredExchange.id}`;
    const { statusCode } = await patchRequest(endpoint, { action: 'accept' });

    assert.equal(statusCode, 403);
  });
});
