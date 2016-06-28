import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
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
          type: 'TEAM',
        };

        const exchange1 = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
          ...defaultArgs,
          title: 'Test shift 1 for team',
        });

        const exchange2 = createExchange(global.users.admin.id, global.networks.flexAppeal.id, {
          ...defaultArgs,
          title: 'Test shift 2 for team',
        });

        return Promise.all([exchange1, exchange2]).then(exchanges => {
          createValuesForExchange(exchanges[0].id, [team.id]);
          createValuesForExchange(exchanges[1].id, [team.id]);
        });
      });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${global.networks.flexAppeal.id}/teams/${team.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.equal(response.statusCode, 200);
      });
  });
});
