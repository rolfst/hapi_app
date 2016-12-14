import { assert } from 'chai';
import * as unit from './implementation';

describe('Network synchronisation helpers', () => {
  describe('getOutOfSyncUsersForTeamLinking', () => {
    it('should return the changed users', () => {
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

      const actual = unit.getOutOfSyncUsersForTeamLinking(
        externalUsers, internalUsers, internalTeams);

      assert.lengthOf(actual, 1);
      assert.deepEqual(actual[0], internalUsers[1]);
    });
  });
});
