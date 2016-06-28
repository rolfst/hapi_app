import { assert } from 'chai';
import moment from 'moment';
import { postRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Create exchange comment', () => {
  before(() => {
    return createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift 1 for network',
    }).then(createdExchange => (exchange = createdExchange));
  });

  it('should create comment for exchange', () => {
    return postRequest(`/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}/comments`, {
      text: 'New comment text',
    })
      .then(response => {
        const { data } = response.result;

        assert.equal(data.text, 'New comment text');
        assert.equal(data.user.id, global.users.admin.id);
        assert.equal(response.statusCode, 200);
      });
  });
});
