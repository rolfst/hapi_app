const { assert } = require('chai');
const qs = require('qs');
const moment = require('moment');
const { find } = require('lodash');
const testHelper = require('../../../shared/test-utils/helpers');
const { getRequest } = require('../../../shared/test-utils/request');
const { exchangeTypes } = require('../repositories/dao/exchange');
const { create } = require('../../core/repositories/team');
const { createExchange } = require('../repositories/exchange');

describe('Get exchanges for team', () => {
  let team;
  let admin;
  let network;

  before(async () => {
    admin = await testHelper.createUser();
    network = await testHelper.createNetwork({ userId: admin.id, name: 'flexappeal' });
    team = await create({ networkId: network.id, name: 'Team #1' });

    const defaultArgs = {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.TEAM,
      values: [team.id],
    };

    const exchange1 = createExchange(admin.id, network.id, {
      ...defaultArgs,
      title: 'Test shift 1 for team',
    });

    const exchange2 = createExchange(admin.id, network.id, {
      ...defaultArgs,
      title: 'Test shift 2 for team',
    });

    const exchange3 = createExchange(admin.id, network.id, {
      ...defaultArgs,
      date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift 2',
    });

    const exchangeInPast = createExchange(admin.id, network.id, {
      ...defaultArgs,
      date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift in past',
    });

    return Promise.all([exchange1, exchange2, exchange3, exchangeInPast]);
  });

  after(() => testHelper.cleanAll());

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${network.id}/teams/${team.id}/exchanges`, admin.token)
      .then(response => {
        const teamExchange = find(response.result.data, { title: 'Test shift 1 for team' });

        assert.equal(response.statusCode, 200);
        assert.deepEqual(teamExchange.created_in, { type: 'team', ids: [team.id.toString()] });
        assert.lengthOf(response.result.data, 4);
        assert.equal(response.result.data[0].user.full_name, admin.fullName);
        assert.lengthOf(response.result.data[0].responses, 0);
        assert.deepEqual(response.result.data[0].created_in, {
          type: 'team',
          ids: [team.id.toString()],
        });
      });
  });

  xit('should fail when no values are provided', () => {
    // TODO
  });

  it('should return exchanges between given date', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/teams/${team.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 2);
  });

  it('should return all upcoming exchanges when start query param is set', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/teams/${team.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 200);
    assert.lengthOf(result.data, 3);
  });

  it('should return error when end query param is set without start param', async () => {
    const query = qs.stringify({
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/teams/${team.id}/exchanges?${query}`;
    const { statusCode } = await getRequest(endpoint, admin.token);

    assert.equal(statusCode, 422);
  });
});
