import { assert } from 'chai';
import moment from 'moment';
import * as exchangeRepo from './exchange';

describe('Exchange Repo', () => {
  describe('findAllAcceptedExchanges ', () => {
    let exchangeId;
    let amountOfExchanges;

    before(async () => {
      const exchanges = await exchangeRepo.findAllAcceptedExchanges();
      amountOfExchanges = exchanges.length;

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
      return exchange.destroy();
    });
    it('should find an exchange', async () => {
      const exchanges = await exchangeRepo.findAllAcceptedExchanges();
      assert.equal(exchanges.length, (amountOfExchanges + 1));
    });
  });
});
