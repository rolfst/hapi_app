import { assert } from 'chai';
import Promise from 'bluebird';
import { map, toString } from 'lodash';
import * as repository from './user';
import * as teamRepository from './team';

describe('User Repository', () => {
  let createdUser;

  before(async() => {
    createdUser = await repository.createUser({
      username: 'johndoe',
      email: 'johndoe@flex-appeal.nl',
      firstName: 'John',
      lastName: 'Doe',
      password: 'foo',
    });
  });

  after(() => repository.deleteById(createdUser.id));

  describe('findUserById', () => {
    it('should return the correct properties', async () => {
      const actual = await repository.findUserById(createdUser.id);

      assert.equal(actual.type, 'user');
      assert.equal(actual.username, 'johndoe');
      assert.equal(actual.firstName, 'John');
      assert.equal(actual.lastName, 'Doe');
      assert.equal(actual.fullName, 'John Doe');
      assert.equal(actual.phoneNum, null);
      assert.equal(actual.email, 'johndoe@flex-appeal.nl');
      assert.equal(actual.externalId, null);
      assert.equal(actual.integrationAuth, null);
      assert.equal(actual.function, null);
      assert.equal(actual.roleType, null);
      assert.deepEqual(actual.teamIds, []);
      assert.equal(actual.dateOfBirth, null);
      assert.property(actual, 'profileImg');
      assert.property(actual, 'createdAt');
      assert.equal(actual.lastLogin, null);
    });

    it('domain object should have the correct teamIds property', async () => {
      const createdTeams = await Promise.all([
        teamRepository.createTeam({ networkId: global.networks.flexAppeal.id, name: 'Team #1' }),
        teamRepository.createTeam({ networkId: global.networks.flexAppeal.id, name: 'Team #2' }),
      ]);

      await teamRepository.addUserToTeams(map(createdTeams, 'id'), createdUser.id);
      const actual = await repository.findUserById(createdUser.id);

      await Promise.map(createdTeams, (team) => teamRepository.deleteById(team.id));

      assert.property(actual, 'teamIds');
      assert.isArray(actual.teamIds);
      assert.deepEqual(actual.teamIds, map(map(createdTeams, 'id'), toString));
    });
  });
});
