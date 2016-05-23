import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createNetwork, deleteNetwork } from 'common/repositories/network';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let network = null;

describe('Get exchanges for network', () => {
  before(() => {
    return Promise.all([
      createNetwork(global.authUser.id),
      createNetwork(global.authUser.id),
    ]).then(([testNetwork, dummyNetwork]) => {
      network = testNetwork;

      const defaultArgs = {
        date: moment().format('YYYY-MM-DD'),
        type: 'ALL',
      };

      createExchange(global.authUser.id, network.id, {
        ...defaultArgs,
        title: 'Test shift 1',
      });

      createExchange(global.authUser.id, network.id, {
        ...defaultArgs,
        title: 'Test shift 2',
      });

      createExchange(global.authUser.id, dummyNetwork.id, {
        ...defaultArgs,
        title: 'Test shift in other network',
      });
    });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${network.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.equal(response.statusCode, 200);
      });
  });

  after(() => deleteNetwork(network.id));
});
