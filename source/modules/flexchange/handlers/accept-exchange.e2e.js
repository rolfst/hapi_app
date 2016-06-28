import { assert } from 'chai';
import moment from 'moment';
import { patchRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Accept exchange', () => {
  before(() => {
    return createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to accept',
    }).then(createdExchange => (exchange = createdExchange));
  });

  it('should return correct data', () => {
    const endpoint = `/v2/networks/${global.networks.flexAppeal.id}/exchanges/${exchange.id}`;

    return patchRequest(endpoint, { action: 'accept' })
      .then(response => {
        const { data } = response.result;

        assert.equal(data.response_status, 'ACCEPTED');
        assert.equal(data.accept_count, 1);
        assert.equal(data.responses[0].response, true);
        assert.equal(data.responses[0].user.full_name, global.users.admin.fullName);
        assert.equal(response.statusCode, 200);
      });
  });
});
