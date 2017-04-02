const { assert } = require('chai');
const R = require('ramda');
const Promise = require('bluebird');
const testHelper = require('../../../shared/test-utils/helpers');
const repository = require('./user');
const teamRepository = require('./team');

describe('User Repository', () => {
  let createdUser;
  let network;
  let anotherNetwork;

  before(async () => {
    createdUser = await repository.createUser({
      username: 'johndoe',
      email: 'johndoe@flex-appeal.nl',
      firstName: 'John',
      lastName: 'Doe',
      password: 'foo',
    });
    const admin = await testHelper.createUser({ password: 'pw' });
    network = await testHelper.createNetwork({ userId: admin.id });
    anotherNetwork = await testHelper.createNetwork({ userId: admin.id });
  });

  after(() => testHelper.cleanAll());

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

    it('domain object should have the correct teamIds propertye', async () => {
      const createdTeams = await Promise.all([
        teamRepository.create({ networkId: network.id, name: 'Team #1' }),
        teamRepository.create({ networkId: anotherNetwork.id, name: 'Team in other network' }),
        teamRepository.create({ networkId: network.id, name: 'Team #2' }),
      ]);

      await teamRepository.addUserToTeams(R.pluck('id', createdTeams), createdUser.id);
      const actual = await repository.findUserById(createdUser.id, network.id);

      await Promise.map(createdTeams, (team) => teamRepository.deleteById(team.id));

      assert.property(actual, 'teamIds');
      assert.isArray(actual.teamIds);
      assert.lengthOf(actual.teamIds, 2);
      assert.include(actual.teamIds, createdTeams[0].id);
      assert.include(actual.teamIds, createdTeams[2].id);
    });

    it('should have the correct teamIds when using network scope', async () => {
      const createdTeams = await Promise.all([
        teamRepository.create({ networkId: network.id, name: 'Team #1' }),
        teamRepository.create({ networkId: anotherNetwork.id, name: 'Team in other network' }),
        teamRepository.create({ networkId: network.id, name: 'Team #2' }),
      ]);

      await teamRepository.addUserToTeams(R.pluck('id', createdTeams), createdUser.id);
      const actual = await repository.findByIds([createdUser.id], network.id);

      await Promise.map(createdTeams, (team) => teamRepository.deleteById(team.id));

      assert.lengthOf(actual[0].teamIds, 2);
      assert.include(actual[0].teamIds, createdTeams[0].id);
      assert.include(actual[0].teamIds, createdTeams[2].id);
    });

    it('should have the correct teamIds when not using network scope', async () => {
      const createdTeams = await Promise.all([
        teamRepository.create({ networkId: network.id, name: 'Team #1' }),
        teamRepository.create({ networkId: anotherNetwork.id, name: 'Team in other network' }),
        teamRepository.create({ networkId: network.id, name: 'Team #2' }),
      ]);

      await teamRepository.addUserToTeams(R.pluck('id', createdTeams), createdUser.id);
      const actual = await repository.findByIds([createdUser.id]);

      await Promise.map(createdTeams, (team) => teamRepository.deleteById(team.id));

      assert.lengthOf(actual[0].teamIds, 3);
      assert.include(actual[0].teamIds, createdTeams[0].id);
      assert.include(actual[0].teamIds, createdTeams[1].id);
      assert.include(actual[0].teamIds, createdTeams[2].id);
    });

    it('should fail when a scoped user is searched for without network id', async () => {
      const actual = repository.findUserById(createdUser.id);

      return assert.isRejected(actual, 'A bad number of arguments is provided for this method');
    });
  });
});
