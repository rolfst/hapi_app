import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Create exchange', () => {
  before(() => {
    return createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift for network',
    }).then(createdExchange => {
      exchange = createdExchange;
    });
  });

  it('should return exchange data', () => {
    return getRequest(`/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`)
      .then(response => {
        const { data } = response.result;

        assert.equal(data.title, 'Test shift for network');
        assert.equal(response.statusCode, 200);
      });
  });
});
