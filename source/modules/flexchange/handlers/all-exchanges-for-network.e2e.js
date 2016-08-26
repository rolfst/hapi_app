import { assert } from 'chai';
import qs from 'qs';
import moment from 'moment';
import { createTeam } from 'common/repositories/team';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for network', () => {
  let network;

  before(async () => {
    const defaultArgs = {
      date: moment().format('YYYY-MM-DD'),
      type: exchangeTypes.NETWORK,
    };

    network = global.networks.flexAppeal;

    const [team1, team2, team3] = await Promise.all([
      createTeam({ networkId: network.id, name: 'Test team 1' }),
      createTeam({ networkId: network.id, name: 'Test team 2' }),
      createTeam({ networkId: network.id, name: 'Test team 3' }),
    ]);

    await global.users.employee.addTeams([team2, team3]);

    const exchanges = await network.getExchanges();
    await Promise.all(exchanges.map(e => e.destroy()));

    const exchange1 = createExchange(global.users.admin.id, network.id, {
      ...defaultArgs,
      title: 'Test shift voor team 1',
      type: exchangeTypes.TEAM,
      values: [team1.id, team2.id],
    });

    const exchange2 = createExchange(global.users.admin.id, network.id, {
      ...defaultArgs,
      title: 'Test shift 2',
    });

    const exchange3 = createExchange(global.users.admin.id, network.id, {
      ...defaultArgs,
      date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
      title: 'Test shift 3',
    });

    return Promise.all([exchange1, exchange2, exchange3]);
  });

  it('should return exchanges for admin', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.isUndefined(result.data[1].responses);
    assert.equal(statusCode, 200);
  });

  it('should return exchanges for employee', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges`;
    const { result } = await getRequest(endpoint, global.server, global.tokens.employee);

    assert.lengthOf(result.data, 3);
  });

  it('should return exchanges with responses', async () => {
    const endpoint = `/v2/networks/${network.id}/exchanges?include=responses`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.isDefined(result.data[0].responses);
    assert.equal(statusCode, 200);
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
