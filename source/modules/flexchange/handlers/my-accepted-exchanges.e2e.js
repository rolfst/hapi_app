const { assert } = require('chai');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const { exchangeTypes } = require('../repositories/dao/exchange');
const {
  acceptExchange,
  declineExchange,
  createExchange,
  approveExchange,
} = require('../repositories/exchange');

describe('My Accepted exchanges', () => {
  let network;
  let admin;

  before(async () => {
    const [owner, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    admin = owner;
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    const acceptedExchangePromise = createExchange(employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Accepted shift',
    }).then((exchange) => acceptExchange(exchange.id, admin.id));

    const approvedExchangePromise = createExchange(employee.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Approved shift',
    })
    .then((exchange) => acceptExchange(exchange.id, admin.id))
    .then((exchange) => approveExchange(exchange, admin, admin.id));

    const declinedExchangePromise = createExchange(admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Declined shift',
    }).then((exchange) => declineExchange(exchange.id, admin.id));

    return Promise.all([
      acceptedExchangePromise,
      declinedExchangePromise,
      approvedExchangePromise,
    ]);
  });

  after(() => testHelper.cleanAll());

  it('should return accepted and approved exchanges', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/exchanges/accepted`;
    const { result } = await getRequest(endpoint, admin.token);

    assert.equal(result.data.length, 2);
  });
});
