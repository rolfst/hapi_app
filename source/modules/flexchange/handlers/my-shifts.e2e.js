import { assert } from 'chai';
import nock from 'nock';
import moment from 'moment';
import sinon from 'sinon';
import * as teamRepo from '../../core/repositories/team';
import { exchangeTypes } from '../repositories/dao/exchange';
import { getRequest } from '../../../shared/test-utils/request';
import { createExchange } from '..//repositories/exchange';

describe('My shifts', () => {
  afterEach(() => nock.cleanAll());

  it('should pair exchanges', async () => {
    const createdTeam = await teamRepo.create({
      networkId: global.networks.pmt.id,
      name: 'Cool Team',
      externalId: '23424',
    });

    const createdExchange = await createExchange(global.users.admin.id, global.networks.pmt.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'External shift from integration',
      shiftId: 25280343,
      teamId: createdTeam.id,
    });

    const stubbedResult = [{
      id: '25280341',
      start_time: '19-12-2016 08:00:00',
      end_time: '19-12-2016 16:30:00',
      department: '12',
      break: '01:30:00',
    }, {
      id: '25280343',
      start_time: '21-12-2016 08:00:00',
      end_time: '21-12-2016 15:00:00',
      department: createdTeam.externalId.toString(),
      break: '01:15:00',
    }];

    const date = moment().format('DD-MM-YYYY');

    nock(global.networks.pmt.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: stubbedResult });

    const endpoint = `/v2/networks/${global.networks.pmt.id}/users/me/shifts`;
    const { result, statusCode } = await getRequest(endpoint);

    await createdExchange.destroy();

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].date, '2016-12-19');
    assert.equal(result.data[0].exchange_id, null);
    assert.equal(result.data[0].team_id, null);
    assert.equal(result.data[1].date, '2016-12-21');
    assert.equal(result.data[1].exchange_id, createdExchange.id);
    assert.equal(result.data[1].team_id, createdTeam.id.toString());
  });

  it('should not respond with teams that are not in the network in team_id property', async () => {
    const stubbedResult = [{
      id: '25280341',
      start_time: '19-12-2016 08:00:00',
      end_time: '19-12-2016 16:30:00',
      department: '25280344',
      break: '01:30:00',
    }, {
      id: '25280343',
      start_time: '21-12-2016 08:00:00',
      end_time: '21-12-2016 15:00:00',
      department: '25280345',
      break: '01:15:00',
    }];

    const date = moment().format('DD-MM-YYYY');

    nock(global.networks.pmt.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: stubbedResult });

    sinon.stub(teamRepo, 'findTeamsByExternalId').returns(Promise.resolve([{
      id: 516,
      networkId: parseInt(global.networks.pmt.id, 10),
      name: 'Cool team',
      externalId: '25280344',
    }, {
      id: 517,
      networkId: parseInt(global.networks.pmt.id, 10) + 10,
      name: 'Other cool team',
      externalId: '25280344',
    }]));

    const endpoint = `/v2/networks/${global.networks.pmt.id}/users/me/shifts`;
    const { result, statusCode } = await getRequest(endpoint);

    teamRepo.findTeamsByExternalId.restore();

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].team_id, '516');
    assert.equal(result.data[1].team_id, null);
  });
});
