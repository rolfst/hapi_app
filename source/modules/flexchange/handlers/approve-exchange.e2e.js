import { assert } from 'chai';
import moment from 'moment';
import { patchRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let exchange = null;

describe('Accept exchange', () => {
  before(() => {
    return createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to approve',
    }).then(createdExchange => (exchange = createdExchange));
  });

  it('should return correct data', () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    return patchRequest(endpoint, { action: 'approve', user_id: 2 })
      .then(response => {
        const { data } = response.result;

        // TODO: assert.equal(data.vote_result, 'APPROVED');
        assert.equal(data.accept_count, 1);
        assert.equal(data.responses[0].response, true);
        assert.equal(data.responses[0].user.full_name, global.authUser.fullName);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should fail when no user_id is present', () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    return patchRequest(endpoint, { action: 'approve' })
      .then(response => {
        assert.equal(response.statusCode, 422);
      });
  });
});
