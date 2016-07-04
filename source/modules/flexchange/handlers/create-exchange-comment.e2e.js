import { assert } from 'chai';
import moment from 'moment';
import { postRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let network;
let exchange;

describe('Create exchange comment', () => {
  before(async () => {
    network = global.networks.flexAppeal;

    exchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift 1 for network',
    });
  });

  it('should create comment for exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/comments`;
    const payload = { text: 'New comment text' };
    const { result, statusCode } = await postRequest(endpoint, payload);

    assert.equal(result.data.text, 'New comment text');
    assert.equal(result.data.user.id, global.users.admin.id);
    assert.equal(statusCode, 200);
  });
});
