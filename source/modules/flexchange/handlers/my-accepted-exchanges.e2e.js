import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'shared/test-utils/request';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import {
  acceptExchange,
  declineExchange,
  createExchange,
  approveExchange,
} from 'modules/flexchange/repositories/exchange';

describe('My Accepted exchanges', () => {
  let network;
  let acceptedExchange;
  let approvedExchange;
  let declinedExchange;

  before(async () => {
    network = global.networks.flexAppeal;

    const acceptedExchangePromise = createExchange(global.users.employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Accepted shift',
    }).then((exchange) => acceptExchange(exchange.id, global.users.admin.id));

    const approvedExchangePromise = createExchange(global.users.employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Approved shift',
    })
    .then((exchange) => acceptExchange(exchange.id, global.users.admin.id))
    .then((exchange) => approveExchange(exchange, global.users.admin, global.users.admin.id));

    const declinedExchangePromise = createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Declined shift',
    }).then((exchange) => declineExchange(exchange.id, global.users.admin.id));

    [acceptedExchange, declinedExchange, approvedExchange] = await Promise.all([
      acceptedExchangePromise,
      declinedExchangePromise,
      approvedExchangePromise,
    ]);
  });

  after(() => Promise.all([
    acceptedExchange.destroy(),
    approvedExchange.destroy(),
    declinedExchange.destroy(),
  ]));

  it('should return accepted and approved exchanges', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/exchanges/accepted`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data.length, 2);
  });
});
