import { assert } from 'chai';
import qs from 'qs';
import moment from 'moment';
import { find } from 'lodash';
import { createTeam } from 'common/repositories/team';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
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

    const exchange1 = createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      title: 'Test shift voor teams',
      type: exchangeTypes.TEAM,
      values: [team1.id, team2.id],
    });

    const exchange2 = createExchange(global.users.admin.id, network.id, {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
      title: 'Test shift 2',
    });

    const exchange3 = createExchange(global.users.admin.id, network.id, {
      type: exchangeTypes.NETWORK,
      date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift 3',
    });

    const exchangeInPast = createExchange(global.users.admin.id, network.id, {
      type: exchangeTypes.NETWORK,
      date: moment().subtract(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift in past',
    });

    createdExchanges = await Promise.all([exchange1, exchange2, exchange3, exchangeInPast]);
  });

  after(() => Promise.all(createdExchanges.map(e => e.destroy())));

  it('should return exchanges for admin', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { result, statusCode } = await getRequest(endpoint);

    const [team1, team2] = createdTeams;
    const teamExchange = find(result.data, { title: 'Test shift voor teams' });

    assert.deepEqual(teamExchange.created_in, { type: 'team', ids: [team1.id, team2.id] });
    assert.lengthOf(result.data, 3);
    assert.lengthOf(result.data[1].responses, 0);
    assert.equal(statusCode, 200);
  });

  it('should return exchanges for employee', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { result } = await getRequest(endpoint, global.server, global.tokens.employee);

    const [team1, team2] = createdTeams;
    const teamExchange = find(result.data, { title: 'Test shift voor teams' });

    assert.deepEqual(teamExchange.created_in, { type: 'team', ids: [team1.id, team2.id] });
    assert.lengthOf(result.data, 3);
  });

  it('should return exchanges between given date', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 2);
    assert.equal(statusCode, 200);
  });

  it('should return all upcoming exchanges when only the start query param is set', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
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
