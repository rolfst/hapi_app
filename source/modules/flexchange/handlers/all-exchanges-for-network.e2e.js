const { assert } = require('chai');
const R = require('ramda');
const qs = require('qs');
const moment = require('moment');
const { map, find } = require('lodash');
const { getRequest } = require('../../../shared/test-utils/request');
const testHelper = require('../../../shared/test-utils/helpers');
const stubs = require('../../../shared/test-utils/stubs');
const teamRepo = require('../../core/repositories/team');
const { exchangeTypes } = require('../repositories/dao/exchange');
const exchangeRepo = require('../repositories/exchange');

describe('Get exchanges for network', () => {
  const pristineNetwork = stubs.pristine_networks_admins[0];

  describe('Integrated network', () => {
    let integratedNetwork;
    let admin;
    let employee;

    before(async () => {
      [admin, employee] = await Promise.all([
        testHelper.createUser(),
        testHelper.createUser(),
      ]);

      const { network: netw } = await testHelper.createNetworkWithIntegration(R.merge(
        {
          userId: admin.id,
          token: 'footoken',
        },
        R.pick(['externalId', 'name', 'integrationName'], pristineNetwork)));
      integratedNetwork = netw;
      const plainNetwork = await testHelper.createNetwork(
        { userId: admin.id, name: 'flexappeal' });

      await testHelper.addUserToNetwork({
        userId: employee.id,
        networkId: integratedNetwork.id,
      });

      const exchangeToAdmin = exchangeRepo.createExchange(employee.id, integratedNetwork.id, {
        type: exchangeTypes.USER,
        date: moment().format('YYYY-MM-DD'),
        description: 'Exchange for shift 1337',
        values: [admin.id],
        shiftId: 1337,
        teamId: 81,
      });

      const exchangeForEmployee = exchangeRepo.createExchange(admin.id, integratedNetwork.id, {
        type: exchangeTypes.USER,
        date: moment().format('YYYY-MM-DD'),
        description: 'Exchange for shift 1338',
        values: [employee.id],
        shiftId: 1338,
        teamId: 80,
      });

      const exchangeForOtherNetwork = exchangeRepo.createExchange(
        admin.id,
        plainNetwork.id,
        {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.NETWORK,
          description: 'Test shift in other network',
        });

      const exchangeCreatedByEmployee = exchangeRepo.createExchange(
        employee.id, integratedNetwork.id, {
          type: exchangeTypes.USER,
          date: moment().format('YYYY-MM-DD'),
          description: 'Exchange for shift 1339',
          values: [admin.id],
          shiftId: 1339,
          teamId: 80,
        });

      await Promise.all([
        exchangeToAdmin,
        exchangeForEmployee,
        exchangeForOtherNetwork,
        exchangeCreatedByEmployee,
      ]);
    });

    after(() => testHelper.cleanAll());

    it('should return exchanges for admin', async () => {
      const endpoint = `/v2/networks/${integratedNetwork.id}/exchanges`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);

      const invidualExchange = find(result.data, { description: 'Exchange for shift 1337' });

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 3);
      assert.deepEqual(invidualExchange.created_in, { type: 'team', ids: ['81'] });
    });

    it('should return exchanges for employee', async () => {
      const endpoint = `/v2/networks/${integratedNetwork.id}/exchanges`;
      const { result, statusCode } = await getRequest(endpoint, employee.token);

      const invidualExchange = find(result.data, { description: 'Exchange for shift 1339' });

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 3);
      assert.deepEqual(invidualExchange.created_in, { type: 'team', ids: ['80'] });
    });
  });

  describe('Normal network', () => {
    let createdTeams;
    let admin;
    let network;
    let employee;

    before(async () => {
      admin = await testHelper.createUser({
        username: 'admin@flex-appeal.nl', password: 'foo' });
      employee = await testHelper.createUser({
        username: 'employee@flex-appeal.nl', password: 'baz' });
      network = await testHelper.createNetwork({ userId: admin.id, name: 'test' });
      const { network: netw } = await testHelper.createNetworkWithIntegration(R.merge(
        {
          userId: admin.id,
          token: 'footoken',
        },
        R.pick(['externalId', 'name', 'integrationName'], pristineNetwork)));
      const integrationNetwork = netw;
      testHelper.addUserToNetwork(
        { networkId: network.id, userId: employee.id, roleType: 'EMPLOYEE' });

      createdTeams = await Promise.all([
        teamRepo.create({ networkId: network.id, name: 'Test team 1' }),
        teamRepo.create({ networkId: network.id, name: 'Test team 2' }),
        teamRepo.create({ networkId: network.id, name: 'Test team 3' }),
      ]);

      const [team1, team2, team3] = createdTeams;

      await Promise.all([
        teamRepo.addUserToTeam(team2.id, employee.id),
        teamRepo.addUserToTeam(team3.id, employee.id),
      ]);

      const exchanges = await exchangeRepo.findExchangesByNetwork(network.id);
      await Promise.all(map(exchanges, (e) => exchangeRepo.deleteById(e.id)));

      const exchangeForTeams = exchangeRepo.createExchange(admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        description: 'Test shift for teams',
        type: exchangeTypes.TEAM,
        values: [team1.id, team2.id],
      });

      const exchangeForTeamWhereEmployeeDoesNotBelongTo = exchangeRepo.createExchange(
        admin.id, network.id, {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.TEAM,
          values: [team1.id],
        });

      const exchangeForNetwork = exchangeRepo.createExchange(employee.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
        description: 'Test shift 2',
      });

      const exchangeForOtherNetwork = exchangeRepo.createExchange(
        admin.id, integrationNetwork.id, {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.NETWORK,
          description: 'Test shift in other network',
        });

      const exchangeInTheFutureForNetwork = exchangeRepo.createExchange(
        admin.id, network.id, {
          type: exchangeTypes.NETWORK,
          date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
          description: 'Test shift 3',
        });

      const exchangeInPast = exchangeRepo.createExchange(admin.id, network.id, {
        type: exchangeTypes.NETWORK,
        date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
        description: 'Test shift in past',
      });

      return Promise.all([
        exchangeForTeamWhereEmployeeDoesNotBelongTo,
        exchangeForTeams,
        exchangeForNetwork,
        exchangeForOtherNetwork,
        exchangeInTheFutureForNetwork,
        exchangeInPast,
      ]);
    });

    after(() => testHelper.cleanAll());

    it('should return exchanges for admin', async () => {
      const endpoint = `/v2/networks/${network.id}/exchanges`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);

      const [team1, team2] = createdTeams;
      const teamExchange = find(result.data, { description: 'Test shift for teams' });

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 5);
      assert.lengthOf(teamExchange.responses, 0);
      assert.deepEqual(teamExchange.created_in, {
        type: 'team',
        ids: [team1.id.toString(), team2.id.toString()],
      });
    });

    it('should return exchanges for employee', async () => {
      const endpoint = `/v2/networks/${network.id}/exchanges`;
      const { result } = await getRequest(endpoint, employee.token);

      const [team1, team2] = createdTeams;
      const teamExchange = find(result.data, { description: 'Test shift for teams' });

      assert.lengthOf(result.data, 4);
      assert.deepEqual(teamExchange.created_in, {
        type: 'team',
        ids: [team1.id.toString(), team2.id.toString()],
      });
    });

    it('should return exchanges between given date', async () => {
      const query = qs.stringify({
        start: moment().startOf('isoweek').format('YYYY-MM-DD'),
        end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
      });

      const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);

      assert.lengthOf(result.data, 3);
      assert.equal(statusCode, 200);
    });

    it('should return all upcoming exchanges when only the start query param is set', async () => {
      const query = qs.stringify({
        start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      });

      const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
      const { result, statusCode } = await getRequest(endpoint, admin.token);

      assert.lengthOf(result.data, 4);
      assert.equal(statusCode, 200);
    });

    it('should return error when end query param is set without start param', async () => {
      const query = qs.stringify({
        end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
      });

      const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
      const { statusCode } = await getRequest(endpoint, admin.token);

      assert.equal(statusCode, 422);
    });
  });
});
