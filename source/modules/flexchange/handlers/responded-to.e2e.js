import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import * as exchangeRepo from 'modules/flexchange/repositories/exchange';

describe('Responded to exchange', () => {
  let network;
  let createdExchanges;

  before(async () => {
    network = global.networks.flexAppeal;
    const user = global.users.admin;

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
      global.users.employee.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
        title: 'Shift from someone else',
      });

    await exchangeRepo.acceptExchange(irrelevantExchange.id, global.users.employee.id);

    createdExchanges = [irrelevantExchange, exchangeToApprove, exchangeToAccept];
  });

  after(() => Promise.all(createdExchanges.map(e => e.destroy())));

  it('should return correct exchanges', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/exchanges/responded_to`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 200);
    assert.equal(result.data.length, 2);
    assert.equal(result.data[0].title, 'Test shift to approve');
    assert.equal(result.data[1].title, 'Test shift to accept');
  });
});
