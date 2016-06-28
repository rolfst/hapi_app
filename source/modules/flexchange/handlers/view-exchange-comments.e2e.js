import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createExchangeComment } from 'modules/flexchange/repositories/comment';

let exchange = null;

describe('View exchange comment', () => {
  before(() => {
    return createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift 1 for network',
    }).then(createdExchange => {
      exchange = createdExchange;
      const userId = global.users.admin.id;

      const comment1 = createExchangeComment(exchange.id, { userId, text: 'Comment #1' });
      const comment2 = createExchangeComment(exchange.id, { userId, text: 'Comment #2' });
      const comment3 = createExchangeComment(exchange.id, { userId, text: 'Comment #3' });

      return Promise.all([comment1, comment2, comment3]);
    });
  });

  it('should return comments for exchange', () => {
    return getRequest(`/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}/comments`)
      .then(response => {
        assert.lengthOf(response.result.data, 3);
        assert.equal(response.statusCode, 200);
      });
  });
});
