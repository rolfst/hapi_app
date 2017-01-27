import { assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as notifier from '../../../shared/services/notifier';
import * as exchangeRepo from '../repositories/exchange';
import { getRequest } from '../../../shared/test-utils/request';

describe('Reminder', () => {
  let sandbox;
  let admin;

  before(async () => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(notifier, 'send').returns(null);

    const [user, employee] = await Promise.all([
      testHelper.createUser(),
      testHelper.createUser(),
    ]);
    admin = user;
    const network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });

    const inTwoDays = moment().add(2, 'd');
    const endTime = inTwoDays.clone();
    endTime.add(5, 'h');

    const exchange = await exchangeRepo.createExchange(
      employee.id,
      network.id,
      {
        date: inTwoDays.format('YYYY-MM-DD'),
        startTime: inTwoDays.toISOString(),
        endTime: endTime.toISOString(),
        title: 'test time retrieval',
        type: 'ALL',
      });

    return exchangeRepo.acceptExchange(exchange.id, admin.id);
  });

  after(() => {
    sandbox.restore();

    return testHelper.cleanAll();
  });

  it('should find an exchange', async () => {
    await getRequest('/v2/exchanges/reminder', admin.token);

    assert.equal(notifier.send.called, true);
  });
});
