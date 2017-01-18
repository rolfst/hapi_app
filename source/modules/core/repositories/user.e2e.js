import { assert } from 'chai';
import R from 'ramda';
import Promise from 'bluebird';
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
      const actual = await repository.findUserById(createdUser.id, null, false);

      assert.equal(actual.type, 'user');
      assert.equal(actual.username, 'johndoe');
      assert.equal(actual.firstName, 'John');
      assert.equal(actual.lastName, 'Doe');
      assert.equal(actual.fullName, 'John Doe');
      assert.equal(actual.phoneNum, null);
      assert.equal(actual.email, 'johndoe@flex-appeal.nl');
      assert.equal(actual.externalId, null);
      assert.equal(actual.integrationAuth, null);
      assert.equal(actual.function, 'Medewerker');
      assert.equal(actual.roleType, null);
      assert.deepEqual(actual.teamIds, []);
      assert.equal(actual.dateOfBirth, null);
      assert.property(actual, 'profileImg');
      assert.property(actual, 'createdAt');
      assert.equal(actual.lastLogin, null);
    });

    it('domain object should have the correct teamIds property', async () => {
      const createdTeams = await Promise.all([
        teamRepository.create({ networkId: global.networks.flexAppeal.id, name: 'Team #1' }),
        teamRepository.create({ networkId: global.networks.flexAppeal.id, name: 'Team #2' }),
      ]);

      await teamRepository.addUserToTeams(R.pluck('id', createdTeams), createdUser.id);
      const actual = await repository.findUserById(createdUser.id, global.networks.flexAppeal.id);

      await Promise.map(createdTeams, (team) => teamRepository.deleteById(team.id));

      assert.property(actual, 'teamIds');
      assert.isArray(actual.teamIds);
      assert.deepEqual(actual.teamIds, R.pluck('id', createdTeams));
    });

    it('should fail when a scoped user is searched for without network id', async () => {
      const actual = repository.findUserById(createdUser.id);

      return assert.isRejected(actual,
          /Error: A bad number of arguments is provided for this method/);
    });
  });
});
