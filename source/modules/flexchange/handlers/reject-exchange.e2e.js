import { assert } from 'chai';
import moment from 'moment';
import { patchRequest } from 'common/test-utils/request';
import {
  createExchange,
  acceptExchange,
  declineExchange,
  approveExchange,
} from 'modules/flexchange/repositories/exchange';

let exchange = null;
let approvedExchange = null;

describe('Reject exchange', () => {
  before(() => {
    const acceptedAndDeclinedExchange = createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to reject',
    })
    .then(createdExchange => {
      const acceptedExchange = acceptExchange(createdExchange.id, 2);
      const declinedExchange = declineExchange(createdExchange.id, 3);

      return Promise.all([acceptedExchange, declinedExchange])
        .then(() => (exchange = createdExchange));
    });

    const approvedExchangePromise = createExchange(global.authUser.id, global.network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
      title: 'Test shift to reject',
    })
    .then(createdExchange => {
      return acceptExchange(createdExchange.id, 2)
        .then(() => approveExchange(createdExchange, global.authUser, 2));
    });

    return Promise.all([acceptedAndDeclinedExchange, approvedExchangePromise])
      .then(values => {
        exchange = values[0];
        approvedExchange = values[1];
      });
  });

  it('should return correct data', () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    return patchRequest(endpoint, { action: 'reject', user_id: 2 })
      .then(response => {
        const { data } = response.result;

        // TODO: assert.equal(data.vote_result, 'REJECTED');
        assert.equal(data.accept_count, 1);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should fail when trying to reject a declined response', () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${exchange.id}`;

    return patchRequest(endpoint, { action: 'reject', user_id: 3 })
      .then(response => {
        assert.equal(response.statusCode, 422);
      });
  });

  it('should fail when trying to reject a response from an already approved exchange', () => {
    const endpoint = `/v2/networks/${global.network.id}/exchanges/${approvedExchange.id}`;

    return patchRequest(endpoint, { action: 'reject', user_id: 2 })
      .then(response => {
        assert.equal(response.statusCode, 422);
      });
  });
});
