import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
  before(() => {
    const defaultArgs = {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
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
        assert.isUndefined(response.result.data[0].responses);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should return exchanges with responses', () => {
    return getRequest(`/v2/networks/${global.networks.flexAppeal.id}/exchanges?include=responses`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.isDefined(response.result.data[0].responses);
        assert.equal(response.statusCode, 200);
      });
  });
});
