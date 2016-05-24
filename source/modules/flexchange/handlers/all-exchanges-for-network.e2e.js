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

    createExchange(global.authUser.id, global.network.id, {
      ...defaultArgs,
      title: 'Test shift 1',
    });

    createExchange(global.authUser.id, global.network.id, {
      ...defaultArgs,
      title: 'Test shift 2',
    });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${global.network.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.equal(response.statusCode, 200);
      });
  });
});
