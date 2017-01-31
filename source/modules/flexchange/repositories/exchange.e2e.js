import { assert } from 'chai';
import moment from 'moment';
import * as testHelper from '../../../shared/test-utils/helpers';
import * as exchangeRepo from './exchange';

describe('Exchange Repo', () => {
  describe('findAllAcceptedExchanges ', () => {
    let amountOfExchanges;

    before(async () => {
      const [admin, employee] = await Promise.all([
        testHelper.createUser(),
        testHelper.createUser(),
      ]);
      const network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
      await testHelper.addUserToNetwork({ userId: employee.id, networkId: network.id });

      const exchanges = await exchangeRepo.findAllAcceptedExchanges();
      amountOfExchanges = exchanges.length;

      const inTwoDays = moment().add(2, 'd');
      const endTime = inTwoDays.clone();
      endTime.add(5, 'h');

      const exchange = await exchangeRepo.createExchange(employee.id, network.id, {
          date: inTwoDays.format('YYYY-MM-DD'),
          startTime: inTwoDays.toISOString(),
          endTime: endTime.toISOString(),
          title: 'test time retrieval',
          type: 'ALL',
        });

      return exchangeRepo.acceptExchange(exchange.id, admin.id);
    });

    after(() => testHelper.cleanAll());

    it('should find an exchange', async () => {
      const exchanges = await exchangeRepo.findAllAcceptedExchanges();
      assert.equal(exchanges.length, (amountOfExchanges + 1));
    });
  });
});
