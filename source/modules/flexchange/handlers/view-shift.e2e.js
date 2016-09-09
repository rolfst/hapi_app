import { assert } from 'chai';
import moment from 'moment';
import nock from 'nock';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('View shift', () => {
  let network;
  let createdExchange;

  const stubbedResult = {
    id: '1337',
    start_time: '21-12-2016 08:00:00',
    end_time: '21-12-2016 15:00:00',
    department: '14',
    break: '01:15:00',
  };

  before(async () => {
    network = global.networks.pmt;

    createdExchange = await createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'External shift from integration',
      shiftId: '1337',
      teamId: 14,
    });

    const date = moment().format('DD-MM-YYYY');

    nock(network.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: [stubbedResult] });
  });

  after(() => nock.cleanAll());

  it('should return correct result', async () => {
    const endpoint = `/v2/networks/${network.id}/shifts/1337`;
    const { result } = await getRequest(endpoint);

    assert.equal(result.data.id, stubbedResult.id);
    assert.property(result.data, 'start_time');
    assert.property(result.data, 'end_time');
    assert.equal(result.data.date, '2016-12-21');
    assert.equal(result.data.break, stubbedResult.break);
    assert.equal(result.data.exchange_id, createdExchange.id);
    assert.equal(result.data.team_id, stubbedResult.department);
  });

  it('should fail when shift not found', async () => {
    const endpoint = `/v2/networks/${network.id}/shifts/1`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 404);
  });
});
