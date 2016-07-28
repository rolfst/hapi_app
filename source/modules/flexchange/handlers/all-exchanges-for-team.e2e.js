import { assert } from 'chai';
import moment from 'moment';
import { exchangeTypes } from 'modules/flexchange/models/exchange';
import { getRequest } from 'common/test-utils/request';
import { createTeam } from 'common/repositories/team';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let team = null;

describe('Get exchanges for team', () => {
  before(() => {
    return createTeam(global.networks.flexAppeal.id, 'Team #1')
      .then(createdTeam => {
        team = createdTeam;

        const defaultArgs = {
          date: moment().format('YYYY-MM-DD'),
          type: exchangeTypes.TEAM,
          values: [team.id],
        };

        const exchange1 = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
          ...defaultArgs,
          title: 'Test shift 1 for team',
        });

        const exchange2 = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
          ...defaultArgs,
          title: 'Test shift 2 for team',
        });

        return Promise.all([exchange1, exchange2]);
      });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${global.networks.flexAppeal.id}/teams/${team.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
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
        assert.lengthOf(response.result.data, 2);
        assert.isDefined(response.result.data[0].responses);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should fail when no values are provided', () => {
    // TODO
  });
});
