const { assert } = require('chai');
const R = require('ramda');
const testHelpers = require('../../../../shared/test-utils/helpers');
const teamRepository = require('../../repositories/team');
const userService = require('./index');

describe('Service: User', () => {
  describe('listUsersWithNetworkScope', () => {
    let createdTeams;
    let serviceResult;
    let employee;
    let organisation;
    let createdFunction;

    before(async () => {
      let admin = null;
      [admin, employee, organisation] = await Promise.all([
        testHelpers.createUser(),
        testHelpers.createUser(),
        testHelpers.createOrganisation(),
      ]);

      let network = null;
      [network, createdFunction] = await Promise.all([
        testHelpers.createNetwork({ userId: admin.id }),
        testHelpers.createOrganisationFunction(organisation.id),
      ]);

      createdTeams = await Promise.all([
        testHelpers.addTeamToNetwork(network.id),
        testHelpers.addTeamToNetwork(network.id),
      ]);

      await Promise.all([
        teamRepository.addUserToTeam(createdTeams[0].id, employee.id),
        testHelpers.addUserToNetwork({ networkId: network.id, userId: employee.id }),
        testHelpers.addUserToOrganisation(
          employee.id,
          organisation.id,
          undefined,
          createdFunction.id
        ),
      ]);

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

    it('should include a function', async () => {
      const actual = R.find(R.always(true), serviceResult);

      assert.property(actual, 'function');
    });

    it('organisation function should override default function on user', async () => {
      const actual = R.find(R.propEq('id', employee.id), serviceResult);

      assert.equal(actual.function, createdFunction.name);
    });
  });
});
