import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('View exchange', () => {
  before(() => {
    return createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to view',
      description: 'Test description for this cool shift',
    }).then(createdExchange => (exchange = createdExchange));
  });

  it('should return correct attributes', () => {
    return getRequest(`/v2/networks/${global.network.id}/exchanges/${exchange.id}`)
    .then(response => {
      const { data } = response.result;

      assert.equal(data.title, 'Test shift to view');
      assert.equal(data.vote_result, null);
      assert.equal(data.description, 'Test description for this cool shift');
    });
  });

  it('should fail when exchange cannot be found', () => {
    return getRequest(`/v2/networks/${global.network.id}/exchanges/${exchange.id + 1337}`)
    .then(response => {
      assert.equal(response.statusCode, 404);
    });
  });
});
