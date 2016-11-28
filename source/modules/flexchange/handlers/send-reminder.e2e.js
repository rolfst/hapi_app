import { assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import * as notifier from '../../../shared/services/notifier';
import * as exchangeRepo from '../repositories/exchange';
import { getRequest } from '../../../shared/test-utils/request';

describe('Reminder', () => {
  let exchangeId;

  before(async () => {
    const inTwoDays = moment().add(2, 'd');
    const endTime = inTwoDays.clone();
    endTime.add(5, 'h');

    const exchange = await exchangeRepo.createExchange(
      global.users.employee.id,
      global.networks.flexAppeal.id,
      {
        date: inTwoDays.format('YYYY-MM-DD'),
        startTime: inTwoDays.toISOString(),
        endTime: endTime.toISOString(),
        title: 'test time retrieval',
        type: 'ALL',
      });

    await exchangeRepo.acceptExchange(exchange.id, global.users.admin.id);

    exchangeId = exchange.id;
  });

  after(async () => {
    const exchange = await exchangeRepo.findExchangeById(exchangeId);
    notifier.send.restore();
    sinon.stub(notifier, 'send').returns(null);

    return exchange.destroy();
  });

  it('should find an exchange', async () => {
    await getRequest('/v2/exchanges/reminder');

    assert.equal(notifier.send.called, true);
  });
});
