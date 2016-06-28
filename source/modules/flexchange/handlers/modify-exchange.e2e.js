import { assert } from 'chai';
import moment from 'moment';
import { patchRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Modify exchange', () => {
  before(() => {
    return createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to check for modification',
    }).then(createdExchange => (exchange = createdExchange));
  });

  it('should fail when action does not exist', () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;

    return patchRequest(endpoint, { action: 'action_that_does_not_exist' })
      .then(response => {
        assert.equal(response.statusCode, 422);
      });
  });
});
