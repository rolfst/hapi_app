import { assert } from 'chai';
import qs from 'qs';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createTeam } from 'common/repositories/team';
import { createExchange } from 'modules/flexchange/repositories/exchange';

describe('Get exchanges for team', () => {
  let team;
  let network;

  before(() => {
    network = global.networks.flexAppeal;

    return createTeam({ networkId: network.id, name: 'Team #1' })
      .then(createdTeam => {
        team = createdTeam;

        const defaultArgs = {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.TEAM,
          values: [team.id],
        };

        const exchange1 = createExchange(global.users.admin.id, network.id, {
          ...defaultArgs,
          title: 'Test shift 1 for team',
        });

        const exchange2 = createExchange(global.users.admin.id, network.id, {
          ...defaultArgs,
          title: 'Test shift 2 for team',
        });

        const exchange3 = createExchange(global.users.admin.id, network.id, {
          ...defaultArgs,
          date: moment().add(2, 'weeks').format('YYYY-MM-DD'),
          title: 'Test shift 2',
        });

        return Promise.all([exchange1, exchange2, exchange3]);
      });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${network.id}/teams/${team.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 3);
        assert.deepEqual(response.result.data[0].created_in, { type: 'team', ids: [team.id] });
        assert.equal(response.result.data[0].user.full_name, global.users.admin.fullName);
        assert.isUndefined(response.result.data[0].responses);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should return exchanges with responses', () => {
    const { flexAppeal } = global.networks;

    return getRequest(`/v2/networks/${flexAppeal.id}/teams/${team.id}/exchanges?include=responses`)
      .then(response => {
        assert.lengthOf(response.result.data, 3);
        assert.isDefined(response.result.data[0].responses);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should fail when no values are provided', () => {
    // TODO
  });

  it('should return exchanges between given date', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/teams/${team.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 2);
    assert.equal(statusCode, 200);
  });

  it('should return all upcoming exchanges when start query param is set', async () => {
    const query = qs.stringify({
      start: moment().startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/teams/${team.id}/exchanges?${query}`;
    const { result, statusCode } = await getRequest(endpoint);

    assert.lengthOf(result.data, 3);
    assert.equal(statusCode, 200);
  });

  it('should return error when end query param is set without start param', async () => {
    const query = qs.stringify({
      end: moment().add(1, 'weeks').startOf('isoweek').format('YYYY-MM-DD'),
    });

    const endpoint = `/v2/networks/${network.id}/teams/${team.id}/exchanges?${query}`;
    const { statusCode } = await getRequest(endpoint);

    assert.equal(statusCode, 422);
  });
});
