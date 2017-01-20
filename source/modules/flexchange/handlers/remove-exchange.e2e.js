import { assert } from 'chai';
import moment from 'moment';
import { deleteRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Remove exchange', () => {
  let network;
  let exchange;

  before(async () => {
    network = global.networks.flexAppeal;

    exchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to view',
      description: 'Test description for this cool shift',
    });
  });

  after(() => exchange.destroy());

  it('should remove the exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { result, statusCode } = await deleteRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.equal(result.success, true);
  });

  it('should fail when exchange cannot be found', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id + 1337}`;
    const { statusCode } = await deleteRequest(endpoint);

    assert.equal(statusCode, 404);
  });
});
