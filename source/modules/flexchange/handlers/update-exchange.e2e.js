import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { putRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Update exchange', () => {
  before(() => {
    return createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to update',
    }).then(createdExchange => (exchange = createdExchange));
  });

  it('should return updated attributes', () => {
    return putRequest(`/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`, {
      title: 'New title',
      description: 'New description',
    })
    .then(response => {
      const { data } = response.result;

      assert.equal(data.title, 'New title');
      assert.equal(data.description, 'New description');
    });
  });
});
