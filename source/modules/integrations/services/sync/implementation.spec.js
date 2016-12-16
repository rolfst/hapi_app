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
});
