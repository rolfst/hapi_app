import { assert } from 'chai';
import * as unit from './implementation';

describe('Network synchronisation helpers', () => {
  describe('getOutOfSyncUsersForTeamLinking', () => {
    const externalUsers = [{
      externalId: '1',
      teamIds: ['1', '2'], // These ids are equal to the internal team's externalId value
    }, {
      externalId: '2',
      teamIds: ['1', '2'], // These ids are equal to the internal team's externalId value
    }];

    const internalTeams = [{
      id: '1',
      networkId: '1',
      externalId: '1',
      name: 'Vulploeg',
      description: null,
    }, {
      id: '2',
      networkId: '1',
      externalId: '2',
      name: 'Kassa',
      description: null,
    }];

    const internalUsers = [{
      id: '1',
      externalId: '1',
      teamIds: ['1', '2'],
    }, {
      id: '2',
      externalId: '2',
      teamIds: [],
    }];

    it('should return the changed users', () => {
      const actual = unit.getOutOfSyncUsersForTeamLinking(
        externalUsers, internalUsers, internalTeams);

      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0], externalUsers[1]);
    });
  });

  describe('getOutOfSyncTeams', () => {
    it('should return the changed teams', () => {
      const internalTeams = [{
        id: '1',
        networkId: '1',
        externalId: '1',
        name: 'Vulploeg',
        description: null,
      }, {
        id: '2',
        networkId: '1',
        externalId: '2',
        name: 'Kassa',
        description: null,
      }];

      const externalTeams = [{
        externalId: '1',
        name: 'Nieuwe Naam',
      }, {
        externalId: '2',
        name: 'Kassa',
      }];

      const actual = unit.getOutOfSyncTeams(internalTeams, externalTeams);

      assert.deepEqual(actual[0], externalTeams[0]);
    });
  });

  describe('replaceExternalTeamIds', () => {
    const externalUser = {
      externalId: '1',
      teamIds: ['1', '2'], // These ids are equal to the internal team's externalId value
    };

    const internalUser = {
      id: '1',
      externalId: '1',
      teamIds: ['1', '2'],
    };

    const internalTeams = [{
      id: '12093',
      networkId: '1',
      externalId: '1',
      name: 'Vulploeg',
      description: null,
    }];

    it('should replace external team ids by matching internal team ids', () => {
      const actual = unit.replaceExternalTeamIds(externalUser, internalUser, internalTeams);
      const expected = { externalId: '1', teamIds: ['12093'] };

      assert.deepEqual(actual, expected);
    });

    it('should be able to handle non matching teams', () => {
      const actual = unit.replaceExternalTeamIds(
        { ...externalUser, teamIds: ['2'] }, internalUser, internalTeams);
      const expected = { externalId: '1', teamIds: [] };

      assert.deepEqual(actual, expected);
    });

    it('should be able to handle empty teamIds array', () => {
      const actual = unit.replaceExternalTeamIds(
        { ...externalUser, teamIds: [] }, internalUser, internalTeams);
      const expected = { externalId: '1', teamIds: [] };

      assert.deepEqual(actual, expected);
    });
  });

  describe('filterExternalUserDuplications', () => {
    it('should return unique users by username', () => {
      const externalUsers = [{
        username: 'johnnyswag',
        externalId: '1340',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'foobar',
        externalId: '1338',
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const actual = unit.filterExternalUserDuplications(externalUsers);

      assert.deepEqual(actual, [
        externalUsers[0],
        externalUsers[2],
      ]);
    });

    it('should include non-active unique users', () => {
      const externalUsers = [{
        username: 'johnnyswag',
        externalId: '1340',
        teamIds: ['1', '2'],
        deletedAt: new Date(),
      }, {
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'foobar',
        externalId: '1338',
        teamIds: ['1', '2'],
        deletedAt: new Date(),
      }];

      const actual = unit.filterExternalUserDuplications(externalUsers);

      assert.deepEqual(actual, [
        externalUsers[1],
        externalUsers[2],
      ]);
    });

    it('should favor active users over non-active users', () => {
      const externalUsers = [{
        username: 'johnnyswag',
        externalId: '1340',
        teamIds: ['1', '2'],
        deletedAt: new Date(),
      }, {
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'foobar',
        externalId: '1338',
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const actual = unit.filterExternalUserDuplications(externalUsers);

      assert.deepEqual(actual, [
        externalUsers[1],
        externalUsers[2],
      ]);
    });
  });

  describe('syncUsers', () => {
    it('should only process users that are changed based on externalId value', () => {
      const allUsersInSystem = [{
        id: '2',
        username: 'johnnyswag',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }];

      const internalUsers = [{
        id: '2',
        username: 'johnnyswag',
        externalId: null,
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const externalUsers = [{
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const actual = unit.syncUsers(allUsersInSystem, internalUsers, externalUsers);

      assert.lengthOf(actual, 1);
      assert.deepEqual(actual, [
        { ...internalUsers[0], externalId: '1339' },
      ]);
    });

    it('should only process users that are changed based on deletedAt value', () => {
      const allUsersInSystem = [{
        id: '2',
        username: 'johnnyswag',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }, {
        id: '3',
        username: 'foobar',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }];

      const nowDate = new Date();

      const internalUsers = [{
        id: '2',
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: new Date(),
      }, {
        id: '3',
        username: 'foobar',
        externalId: '1340',
        teamIds: ['1'],
        deletedAt: null,
      }];

      const externalUsers = [{
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'foobar',
        externalId: '1340',
        teamIds: ['1'],
        deletedAt: nowDate,
      }];

      const actual = unit.syncUsers(allUsersInSystem, internalUsers, externalUsers);

      assert.lengthOf(actual, 2);
      assert.deepEqual(actual, [
        { ...internalUsers[0], deletedAt: null },
        { ...internalUsers[1], deletedAt: nowDate },
      ]);
    });

    it('should set the correct externalId value', () => {
      const allUsersInSystem = [{
        id: '2',
        username: 'johnnyswag',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }];

      const internalUsers = [{
        id: '2',
        username: 'johnnyswag',
        externalId: null,
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const externalUsers = [{
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const actual = unit.syncUsers(allUsersInSystem, internalUsers, externalUsers);
      const expected = [
        { ...internalUsers[0], externalId: '1339' },
      ];

      assert.lengthOf(actual, expected.length);
      assert.deepEqual(actual, expected);
    });

    it('should set the correct deletedAt value', () => {
      const allUsersInSystem = [{
        id: '3',
        username: 'foobar',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }];

      const nowDate = new Date();

      const internalUsers = [{
        id: '3',
        username: 'foobar',
        externalId: '1340',
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const externalUsers = [{
        username: 'foobar',
        externalId: '1340',
        teamIds: ['1', '2'],
        deletedAt: nowDate,
      }];

      const actual = unit.syncUsers(allUsersInSystem, internalUsers, externalUsers);
      const expected = [
        { ...internalUsers[0], deletedAt: nowDate },
      ];

      assert.lengthOf(actual, expected.length);
      assert.deepEqual(actual, expected);
    });

    it('should include non-existing users for network', () => {
      const allUsersInSystem = [{
        id: '1',
        username: 'johndoe',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }, {
        id: '2',
        username: 'johnnyswag',
        externalId: null,
        teamIds: [],
        deletedAt: null,
      }];

      const nowDate = new Date();

      const internalUsers = [{
        id: '2',
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: null,
      }];

      const externalUsers = [{
        username: 'johndoe',
        externalId: '1338',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: nowDate,
      }];

      const actual = unit.syncUsers(allUsersInSystem, internalUsers, externalUsers);
      const expected = [
        { ...internalUsers[0], deletedAt: nowDate },
        { ...allUsersInSystem[0], externalId: '1338' },
      ];

      assert.lengthOf(actual, expected.length);
      assert.deepEqual(actual, expected);
    });
  });

  describe('filterUsersToDelete', () => {
    it('should return correct users', () => {
      const internalUsers = [{
        id: '1',
        username: 'foobar',
        externalId: '1337',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        id: '2',
        username: 'johndoe',
        externalId: '1338',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        id: '3',
        username: 'johnnyswag',
        externalId: '1339',
        teamIds: ['1', '2'],
        deletedAt: new Date(),
      }];

      const externalUsers = [{
        username: 'foobar',
        externalId: '1337',
        teamIds: ['1', '2'],
        deletedAt: null,
      }, {
        username: 'johndoe',
        externalId: '1338',
        teamIds: ['1', '2'],
        deletedAt: new Date(),
      }];

      const actual = unit.filterUsersToDelete(internalUsers, externalUsers);

      assert.deepEqual(actual, [internalUsers[1]]);
    });
  });

  describe('filterNonExistingUsers', () => {
    it('should return correct users', () => {
      const externalUsers = [{
        username: 'johndoe',
        externalId: '1336',
        teamIds: ['1', '2'],
      }, {
        username: 'foobar',
        externalId: '1337',
        teamIds: ['1', '2'],
      }];

      const internalUsers = [{
        id: '1',
        username: 'johndoe',
        externalId: '1336',
        teamIds: ['1', '2'],
      }];

      const actual = unit.filterNonExistingUsers(internalUsers, externalUsers);
      const expected = externalUsers[1];

      assert.deepEqual(actual, [expected]);
    });
  });
});
