import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createExchangeComment } from 'modules/flexchange/repositories/comment';

let exchange = null;

describe('Get exchanges comment', () => {
  before(() => {
    return createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift 1 for network',
    }).then(createdExchange => {
      exchange = createdExchange;
      const userId = global.authUser.id;

      const p1 = createExchangeComment(exchange.id, { userId, text: 'Comment #1' });
      const p2 = createExchangeComment(exchange.id, { userId, text: 'Comment #2' });
      const p3 = createExchangeComment(exchange.id, { userId, text: 'Comment #3' });

      return Promise.all([p1, p2, p3]);
    });
  });

  it('should return comments for exchange', () => {
    return getRequest(`/v2/networks/${global.network.id}/exchanges/${exchange.id}/comments`)
      .then(response => {
        assert.lengthOf(response.result.data, 3);
        assert.equal(response.statusCode, 200);
      });
  });
});
