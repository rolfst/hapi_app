import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import {
  acceptExchange,
  declineExchange,
  createExchange,
  approveExchange,
} from 'modules/flexchange/repositories/exchange';

describe('Accepted exchanges', () => {
  let network;
  let acceptedExchange;
  let approvedExchange;
  let declinedExchange;

  before(() => {
    network = global.networks.flexAppeal;

    acceptedExchange = createExchange(global.users.employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Accepted shift',
    }).then((exchange) => acceptExchange(exchange.id, global.users.admin.id));

    approvedExchange = createExchange(global.users.employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Approved shift',
    })
    .then((exchange) => acceptExchange(exchange.id, global.users.admin.id))
    .then((exchange) => approveExchange(exchange, global.users.admin, global.users.admin.id));

    declinedExchange = createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Declined shift',
    }).then((exchange) => declineExchange(exchange.id, global.users.admin.id));

    return Promise.all([acceptedExchange, declinedExchange, approvedExchange]);
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
