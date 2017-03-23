const { assert } = require('chai');
const nock = require('nock');
const moment = require('moment');
const sinon = require('sinon');
const R = require('ramda');
const testHelper = require('../../../shared/test-utils/helpers');
const stubs = require('../../../shared/test-utils/stubs');
const teamRepo = require('../../core/repositories/team');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { getRequest } = require('../../../shared/test-utils/request');
const { createExchange } = require('..//repositories/exchange');

describe('My shifts', () => {
  const pristineNetwork = stubs.pristine_networks_admins[0];
  let sandbox;
  let admin;
  let integratedNetwork;

  before(async () => {
    sandbox = sinon.sandbox.create();

    admin = await testHelper.createUser();
    const { network } = await testHelper.createNetworkWithIntegration(R.merge(
      R.pick(['externalId', 'name', 'integrationName'], pristineNetwork),
      {
        userId: admin.id,
        token: 'footoken',
        userToken: 'foo',
      }
    ));
    integratedNetwork = network;
  });

  afterEach(() => {
    sandbox.restore();
    nock.cleanAll();
  });

  after(() => testHelper.cleanAll());

  it('should pair exchanges', async () => {
    const createdTeam = await teamRepo.create({
      networkId: integratedNetwork.id,
      name: 'Cool Team',
      externalId: '23424',
    });

    const createdExchange = await createExchange(admin.id, integratedNetwork.id, {
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

    nock(integratedNetwork.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: stubbedResult });

    const endpoint = `/v2/networks/${integratedNetwork.id}/users/me/shifts`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

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

    nock(integratedNetwork.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: stubbedResult });

    sandbox.stub(teamRepo, 'findTeamsByExternalId').returns(Promise.resolve([{
      id: 516,
      networkId: parseInt(integratedNetwork.id, 10),
      name: 'Cool team',
      externalId: '25280344',
    }, {
      id: 517,
      networkId: parseInt(integratedNetwork.id, 10) + 10,
      name: 'Other cool team',
      externalId: '25280344',
    }]));

    const endpoint = `/v2/networks/${integratedNetwork.id}/users/me/shifts`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    teamRepo.findTeamsByExternalId.restore();

    assert.equal(statusCode, 200);
    assert.equal(result.data[0].team_id, '516');
    assert.equal(result.data[1].team_id, null);
  });
});
