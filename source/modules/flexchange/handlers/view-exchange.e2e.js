import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let network;
let exchange;

describe('View exchange', () => {
  before(async () => {
    network = global.networks.flexAppeal;

    exchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to view',
      description: 'Test description for this cool shift',
    });
  });

  it('should return correct attributes', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data.title, 'Test shift to view');
    assert.equal(result.data.vote_result, null);
    assert.equal(result.data.description, 'Test description for this cool shift');
  });

  it('should fail when exchange cannot be found', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id + 1337}`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });
});
