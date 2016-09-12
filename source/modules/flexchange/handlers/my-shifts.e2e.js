import { assert } from 'chai';
import nock from 'nock';
import moment from 'moment';
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
      teamId: 14,
    });

    const stubbedResult = [{
      id: '25280341',
      start_time: '19-12-2016 08:00:00',
      end_time: '19-12-2016 16:30:00',
      department: '14',
      break: '01:30:00',
    }, {
      id: '25280343',
      start_time: '21-12-2016 08:00:00',
      end_time: '21-12-2016 15:00:00',
      department: '14',
      break: '01:15:00',
    }];

    const date = moment().format('DD-MM-YYYY');

    nock(network.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: stubbedResult });
  });

  after(() => createdExchange.destroy());

  it('should pair exchanges', async () => {
    const endpoint = `/v2/networks/${network.id}/users/me/shifts`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data[0].date, '2016-12-19');
    assert.equal(result.data[0].exchange_id, null);
    assert.equal(result.data[0].team_id, null);
    assert.equal(result.data[1].date, '2016-12-21');
    assert.equal(result.data[1].exchange_id, createdExchange.id);
    assert.equal(result.data[1].team_id, 14);
  });
});
