const { assert } = require('chai');
const moment = require('moment');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const { exchangeTypes } = require('../repositories/dao/exchange');
const exchangeRepo = require('../repositories/exchange');

describe('Responded to exchange', () => {
  let user;
  let network;

  before(async () => {
    const [admin, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    user = admin;
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    const exchangeToApprove = await exchangeRepo.createExchange(user.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to approve',
    });

    await exchangeRepo.acceptExchange(exchangeToApprove.id, user.id);
    await exchangeRepo.approveExchange(exchangeToApprove, user, user.id);

    const exchangeToAccept = await exchangeRepo.createExchange(user.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to accept',
    });

    await exchangeRepo.acceptExchange(exchangeToAccept.id, user.id);

    const exchangeToReject = await exchangeRepo.createExchange(user.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift to reject',
    });

    await exchangeRepo.acceptExchange(exchangeToReject.id, user.id);
    await exchangeRepo.rejectExchange(exchangeToReject, user, user.id);

    const irrelevantExchange = await exchangeRepo.createExchange(
      employee.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
        title: 'Shift from someone else',
      });

    return exchangeRepo.acceptExchange(irrelevantExchange.id, employee.id);
  });

  after(() => testHelper.cleanAll());

  it('should return correct exchanges', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/exchanges/responded_to`;
    const { result, statusCode } = await getRequest(endpoint, user.token);

    assert.equal(statusCode, 200);
    assert.equal(result.data.length, 2);
    assert.equal(result.data[0].title, 'Test shift to approve');
    assert.equal(result.data[1].title, 'Test shift to accept');
  });
});
