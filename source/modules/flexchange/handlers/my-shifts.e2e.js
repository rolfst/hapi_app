import { assert } from 'chai';
import sinon from 'sinon';
import moment from 'moment';
import * as createAdapter from 'common/utils/create-adapter';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('My shifts', () => {
  let network;
  let createdExchange;

  before(async () => {
    network = global.networks.pmt;

    createdExchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'External shift from integration',
      shiftId: 25280343,
    });

    const stubbedResult = [{
      id: '25280341',
      start_time: '2016-12-19T08:00:00+0100',
      end_time: '2016-12-19T16:30:00+0100',
      break: '01:30:00',
    }, {
      id: '25280343',
      start_time: '2016-12-21T08:00:00+0100',
      end_time: '2016-12-21T15:00:00+0100',
      break: '01:15:00',
    }];

    sinon.stub(createAdapter, 'default').returns({
      myShifts: () => stubbedResult,
    });
  });

  after(() => createAdapter.default.restore());

  it('should pair exchanges', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/shifts`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data[0].exchange_id, null);
    assert.equal(result.data[1].exchange_id, createdExchange.id);
  });
});
