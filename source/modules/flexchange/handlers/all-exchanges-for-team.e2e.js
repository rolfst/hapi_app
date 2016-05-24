import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
import { createTeam } from 'common/repositories/team';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let team = null;

describe('Get exchanges for team', () => {
  before(() => {
    return createTeam(global.network.id, 'Team #1')
      .then(createdTeam => {
        team = createdTeam;

        const defaultArgs = {
          date: moment().format('YYYY-MM-DD'),
          type: 'TEAM',
        };

        const p1 = createExchange(global.authUser.id, global.network.id, {
          ...defaultArgs,
          title: 'Test shift 1 for team',
        });

        const p2 = createExchange(global.authUser.id, global.network.id, {
          ...defaultArgs,
          title: 'Test shift 2 for team',
        });

        return Promise.all([p1, p2]).then(([r1, r2]) => {
          createValuesForExchange(r1.id, [team.id]);
          createValuesForExchange(r2.id, [team.id]);
        });
      });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/networks/${global.network.id}/teams/${team.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.equal(response.statusCode, 200);
      });
  });
});
