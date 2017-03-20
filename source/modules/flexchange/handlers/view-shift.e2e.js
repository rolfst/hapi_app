const { assert } = require('chai');
const R = require('ramda');
const moment = require('moment');
const nock = require('nock');
const testHelper = require('../../../shared/test-utils/helpers');
const sharedStubs = require('../../../shared/test-utils/stubs');
const { getRequest } = require('../../../shared/test-utils/request');
const stubs = require('../../integrations/adapters/pmt/test-utils/stubs');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { createExchange } = require('../repositories/exchange');

describe('Handler: View shift', () => {
  const pristineNetwork = sharedStubs.pristine_networks_admins[0];
  let admin;
  let integratedNetwork;
  let createdExchange;

  const stubbedResult = {
    id: '133723',
    start_time: '21-12-2016 08:00:00',
    end_time: '21-12-2016 15:00:00',
    department: '12',
    break: '01:15:00',
  };

  before(async () => {
    admin = await testHelper.createUser();
    const flexappealNetwork = await testHelper.createNetwork({
      userId: admin.id, name: 'flexappeal' });
    const { network } = await testHelper.createNetworkWithIntegration(R.merge(
      R.pick(pristineNetwork, 'externalId', 'name', 'integrationName'),
      {
        userId: admin.id,
        token: 'footoken',
        userToken: 'foo',
      }
    ));
    integratedNetwork = network;

    createdExchange = await createExchange(admin.id, flexappealNetwork.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'External shift from integration',
      shiftId: '133723',
      teamId: 14,
    });

    const date = moment().format('DD-MM-YYYY');

    nock(integratedNetwork.externalId)
      .get(`/me/shifts/${date}`)
      .reply(200, { shifts: [stubbedResult] });
  });

  after(() => testHelper.cleanAll());

  it('should return correct result', async () => {
    const endpoint = `/v2/networks/${integratedNetwork.id}/shifts/133723`;
    const { result } = await getRequest(endpoint, admin.token);

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

    nock(integratedNetwork.externalId)
      .get(`/me/shifts/${today}`)
      .reply(200, stubs.shifts_empty_200);

    const endpoint = `/v2/networks/${integratedNetwork.id}/shifts/1`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 404);
  });
});
