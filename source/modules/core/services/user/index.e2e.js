import { assert } from 'chai';
import R from 'ramda';
import * as testHelpers from '../../../../shared/test-utils/helpers';
import * as teamRepository from '../../repositories/team';
import * as userService from './index';

describe('Service: User', () => {
  describe('listUsersWithNetworkScope', () => {
    let createdTeams;
    let serviceResult;

    before(async () => {
      const [admin, employee] = await Promise.all([
        testHelpers.createUser(),
        testHelpers.createUser(),
      ]);

      const network = await testHelpers.createNetwork({ userId: admin.id });
      await testHelpers.addUserToNetwork({ networkId: network.id, userId: employee.id });

      createdTeams = await Promise.all([
        testHelpers.addTeamToNetwork(network.id),
        testHelpers.addTeamToNetwork(network.id),
      ]);

      await teamRepository.addUserToTeam(createdTeams[0].id, employee.id);

      serviceResult = await userService.listUsersWithNetworkScope({
        userIds: [admin.id, employee.id],
        networkId: network.id,
      });
    });

    after(() => testHelpers.cleanAll());

    it('should include correct teamIds', async () => {
      const actual = R.find(R.propEq('roleType', 'EMPLOYEE'), serviceResult);

      assert.include(actual.teamIds, createdTeams[0].id);
    });
  });
});
