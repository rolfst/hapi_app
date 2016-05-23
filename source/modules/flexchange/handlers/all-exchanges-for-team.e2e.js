import { assert } from 'chai';
import moment from 'moment';
import { getRequest } from 'common/test-utils/request';
import { createNetwork, deleteNetwork } from 'common/repositories/network';
import { createExchange } from 'modules/flexchange/repositories/exchange';

let network = null;
let team = null;

describe('Get exchanges for team', () => {
  before(() => {
    return createNetwork(global.authUser.id)
      .then(createdNetwork => {
        network = createdNetwork;

        return Promise.all([

        ]).then(createdTeam => {
          team = createdTeam;
          // const defaultArgs = {
          //   date: moment().format('YYYY-MM-DD'),
          //   type: 'TEAM',
          // };
          //
          // createExchange(global.authUser.id, network.id, {
          //   ...defaultArgs,
          //   title: 'Test shift 1 for team',
          // });
          //
          // createExchange(global.authUser.id, network.id, {
          //   ...defaultArgs,
          //   title: 'Test shift 2 for team',
          // });
        });
      });
  });

  it('should return exchanges', () => {
    return getRequest(`/v2/teams/${team.id}/exchanges`)
      .then(response => {
        assert.lengthOf(response.result.data, 2);
        assert.equal(response.statusCode, 200);
      });
  });

  after(() => deleteNetwork(network.id));
});
