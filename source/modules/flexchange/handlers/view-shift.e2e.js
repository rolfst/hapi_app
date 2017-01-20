import { assert } from 'chai';
import moment from 'moment';
import nock from 'nock';
import * as stubs from '../../../adapters/pmt/test-utils/stubs';
import { getRequest } from '../../../shared/test-utils/request';
import { exchangeTypes } from '../repositories/dao/exchange';
import { createExchange } from '../repositories/exchange';

describe('Handler: View shift', () => {
  let network;
  let createdExchange;

  const stubbedResult = {
    id: '133723',
    start_time: '21-12-2016 08:00:00',
    end_time: '21-12-2016 15:00:00',
    department: '12',
    break: '01:15:00',
  };

  before(async () => {
    network = global.networks.pmt;

    createdExchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'External shift from integration',
      shiftId: '133723',
      teamId: 14,
    });

    const date = moment().format('DD-MM-YYYY');

    nock(network.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: [stubbedResult] });
  });

  after(() => createdExchange.destroy());

  it('should return correct result', async () => {
    const endpoint = `/v2/networks/${network.id}/shifts/133723`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data.id, stubbedResult.id);
    assert.property(result.data, 'start_time');
    assert.property(result.data, 'end_time');
    assert.equal(result.data.date, '2016-12-21');
    assert.equal(result.data.break, stubbedResult.break);
    assert.equal(result.data.exchange_id, createdExchange.id);
    assert.equal(result.data.team_id, null);
  });

  it('should fail when shift not found', async () => {
    const today = moment().format('DD-MM-YYYY');
    nock(global.networks.pmt.externalId)
      .get(`/me/shifts/${today}`)
      .reply(200, stubs.shifts_empty_200);

    const endpoint = `/v2/networks/${network.id}/shifts/1`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });
});
