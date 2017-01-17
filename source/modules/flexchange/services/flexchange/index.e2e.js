import { assert } from 'chai';
import moment from 'moment';
import * as exchangeService from './index';

describe.only('Service: Flexchange', () => {
  describe('list', () => {
    let createdExchange1;

    before(async () => {
      createdExchange1 = await exchangeService.createExchange({
        date: moment().toISOString(),
        startTime: moment().toISOString(),
        endTime: moment().add(2, 'hours').toISOString(),
        type: 'ALL',
        values: [global.networks.flexAppeal.id],
      }, {
        network: { id: global.networks.flexAppeal.id },
        credentials: { id: global.users.admin.id },
      });
    });

    it('should return correct exchange models', async () => {
      const actual = await exchangeService.list({
        networkId: global.networks.flexAppeal.id,
        exchangeIds: [createdExchange1.id],
      }, {
        credentials: { id: global.users.admin.id },
      });
    });
  });
});
