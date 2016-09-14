import { assert } from 'chai';
import qs from 'qs';
import moment from 'moment';
import { find } from 'lodash';
import { createTeam } from 'common/repositories/team';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
  describe('Integrated network', () => {
    let integratedNetwork;
    let createdExchanges;

    before(async () => {
      integratedNetwork = global.networks.pmt;

      await global.users.employee.addNetwork(integratedNetwork);

      const { employee, admin } = global.users;

      const exchangeToAdmin = createExchange(employee.id, integratedNetwork.id, {
        type: exchangeTypes.USER,
        date: moment().format('YYYY-MM-DD'),
        title: 'Exchange for shift 1337',
        values: [admin.id],
        shiftId: 1337,
        teamId: 81,
      });

      const exchangeForEmployee = createExchange(admin.id, integratedNetwork.id, {
        type: exchangeTypes.USER,
        date: moment().format('YYYY-MM-DD'),
        title: 'Exchange for shift 1338',
        values: [employee.id],
        shiftId: 1338,
        teamId: 80,
      });

      const exchangeForOtherNetwork = createExchange(
        global.users.admin.id, global.networks.flexAppeal.id, {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.NETWORK,
          title: 'Test shift in other network',
        });

      const exchangeCreatedByEmployee = createExchange(employee.id, integratedNetwork.id, {
        type: exchangeTypes.USER,
        date: moment().format('YYYY-MM-DD'),
        title: 'Exchange for shift 1339',
        values: [admin.id],
        shiftId: 1339,
        teamId: 80,
      });

      createdExchanges = await Promise.all([
        exchangeToAdmin,
        exchangeForEmployee,
        exchangeForOtherNetwork,
        exchangeCreatedByEmployee,
      ]);
    });

    after(async () => {
      await Promise.all(createdExchanges.map(e => e.destroy()));
      await global.users.employee.removeNetwork(integratedNetwork);
    });

    it('should return exchanges for admin', async () => {
      const endpoint = `/v2/networks/${integratedNetwork.id}/exchanges`;
      const { result, statusCode } = await getRequest(endpoint);

      const invidualExchange = find(result.data, { title: 'Exchange for shift 1337' });

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 3);
      assert.deepEqual(invidualExchange.created_in, { type: 'team', ids: [81] });
    });

    it('should return exchanges for employee', async () => {
      const endpoint = `/v2/networks/${integratedNetwork.id}/exchanges`;
      const token = global.tokens.employee;
      const { result, statusCode } = await getRequest(endpoint, global.server, token);

      const invidualExchange = find(result.data, { title: 'Exchange for shift 1339' });

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 3);
      assert.deepEqual(invidualExchange.created_in, { type: 'team', ids: [80] });
    });
  });

  describe('Normal network', () => {
    let createdTeams;
    let network;
    let createdExchanges;

    before(async () => {
      network = global.networks.flexAppeal;

      createdTeams = await Promise.all([
        createTeam({ networkId: network.id, name: 'Test team 1' }),
        createTeam({ networkId: network.id, name: 'Test team 2' }),
        createTeam({ networkId: network.id, name: 'Test team 3' }),
      ]);

      const [team1, team2, team3] = createdTeams;

      await global.users.employee.addTeams([team2, team3]);

      const exchanges = await network.getExchanges();
      await Promise.all(exchanges.map(e => e.destroy()));

      const exchangeForTeams = createExchange(global.users.admin.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        title: 'Test shift for teams',
        type: exchangeTypes.TEAM,
        values: [team1.id, team2.id],
      });

      const exchangeForTeamWhereEmployeeDoesNotBelongTo = createExchange(
        global.users.admin.id, network.id, {
          date: moment().format('YYYY-MM-DD'),
          title: 'Test shift for teams',
          type: exchangeTypes.TEAM,
          values: [team1.id],
        });

      const exchangeForNetwork = createExchange(global.users.employee.id, network.id, {
        date: moment().format('YYYY-MM-DD'),
        type: exchangeTypes.NETWORK,
        title: 'Test shift 2',
      });

      const exchangeForOtherNetwork = createExchange(
        global.users.admin.id, global.networks.pmt.id, {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.NETWORK,
          title: 'Test shift in other network',
        });

      const exchangeInTheFutureForNetwork = createExchange(global.users.admin.id, network.id, {
        type: exchangeTypes.NETWORK,
        date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
        title: 'Test shift 3',
      });

      const exchangeInPast = createExchange(global.users.admin.id, network.id, {
        type: exchangeTypes.NETWORK,
        date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
        title: 'Test shift in past',
      });

      createdExchanges = await Promise.all([
        exchangeForTeamWhereEmployeeDoesNotBelongTo,
        exchangeForTeams,
        exchangeForNetwork,
        exchangeForOtherNetwork,
        exchangeInTheFutureForNetwork,
        exchangeInPast,
      ]);
    });

    after(() => Promise.all(createdExchanges.map(e => e.destroy())));

    it('should return exchanges for admin', async () => {
      const endpoint = `/v2/networks/${network.id}/exchanges`;
      const { result, statusCode } = await getRequest(endpoint);

      const [team1, team2] = createdTeams;
      const teamExchange = find(result.data, { title: 'Test shift for teams' });

      assert.equal(statusCode, 200);
      assert.lengthOf(result.data, 5);
      assert.deepEqual(teamExchange.created_in, { type: 'team', ids: [team1.id, team2.id] });
      assert.lengthOf(teamExchange.responses, 0);
    });

    it('should return exchanges for employee', async () => {
      const endpoint = `/v2/networks/${network.id}/exchanges`;
      const { result } = await getRequest(endpoint, global.server, global.tokens.employee);

      const [team1, team2] = createdTeams;
      const teamExchange = find(result.data, { title: 'Test shift for teams' });

      assert.deepEqual(teamExchange.created_in, { type: 'team', ids: [team1.id, team2.id] });
      assert.lengthOf(result.data, 4);
    });

    it('should return exchanges between given date', async () => {
      const query = qs.stringify({
        start: moment().startOf('isoweek').format('YYYY-MM-DD'),
        end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
      });

      const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
      const { result, statusCode } = await getRequest(endpoint);

      assert.lengthOf(result.data, 3);
      assert.equal(statusCode, 200);
    });

    it('should return all upcoming exchanges when only the start query param is set', async () => {
      const query = qs.stringify({
        start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      });

      const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
      const { result, statusCode } = await getRequest(endpoint);

      assert.lengthOf(result.data, 4);
      assert.equal(statusCode, 200);
    });

    it('should return error when end query param is set without start param', async () => {
      const query = qs.stringify({
        end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
      });

      const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
      const { statusCode } = await getRequest(endpoint);

      assert.equal(statusCode, 422);
    });
  });
});
