import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
  let network;

  before(() => {
    const defaultArgs = {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
    };

    network = global.networks.flexAppeal;

    return network.getExchanges().then(exchanges => {
      return exchanges.map(e => e.destroy());
    }).then(() => {
      const exchange1 = createExchange(global.users.admin.id, network.id, {
        ...defaultArgs,
        title: 'Test shift 1',
      });

      const exchange2 = createExchange(global.users.admin.id, network.id, {
        ...defaultArgs,
        title: 'Test shift 2',
      });

      return Promise.all([exchange1, exchange2]);
    });
  });

  it('should return exchanges', async () => {
    const { result, statusCode } = await getRequest(`/v2/networks/${network.id}/exchanges`);

    assert.lengthOf(result.data, 2);
    assert.deepEqual(result.data[0].created_in, { type: 'network', id: network.id });
    assert.equal(result.data[0].user.full_name, global.users.admin.fullName);
    assert.isUndefined(result.data[0].responses);
    assert.equal(statusCode, 200);
  });

  it('should return exchanges with responses', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges?include=responses`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 2);
    assert.isDefined(result.data[0].responses);
    assert.equal(statusCode, 200);
  });
});
