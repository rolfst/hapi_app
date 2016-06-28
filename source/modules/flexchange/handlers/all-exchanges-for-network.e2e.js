import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
  before(() => {
    const defaultArgs = {
      date: moment().format('YYYY-MM-DD'),
      type: 'ALL',
    };

    return global.networks.flexAppeal.getExchanges().then(exchanges => {
      return exchanges.map(e => e.destroy());
    }).then(() => {
      const exchange1 = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
        ...defaultArgs,
        title: 'Test shift 1',
      });

      const exchange2 = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
        ...defaultArgs,
        title: 'Test shift 2',
      });

      return Promise.all([exchange1, exchange2]);
    });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${global.networks.flexAppeal.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.equal(response.statusCode, 200);
      });
  });
});
