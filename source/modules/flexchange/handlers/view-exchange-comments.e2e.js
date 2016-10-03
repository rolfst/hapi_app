import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'shared/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createExchangeComment } from 'modules/flexchange/repositories/comment';

describe('View exchange comment', () => {
  let network;
  let exchange;
  let createdComments;

  before(async () => {
    network = global.networks.flexAppeal;
    const userId = global.users.admin.id;

    exchange = await createExchange(userId, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift 1 for network',
    });

    const comment1 = createExchangeComment(exchange.id, { userId, text: 'Comment #1' });
    const comment2 = createExchangeComment(exchange.id, { userId, text: 'Comment #2' });
    const comment3 = createExchangeComment(exchange.id, { userId, text: 'Comment #3' });

    createdComments = await Promise.all([comment1, comment2, comment3]);
  });

  after(() => Promise.all([...createdComments, exchange].map(model => model.destroy())));

  it('should return comments for exchange', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges/${exchange.id}/comments`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });
});