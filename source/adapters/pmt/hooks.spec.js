import nock from 'nock';
import fetchTeams from 'adapters/pmt/hooks/fetch-teams';
import fetchUsers from 'adapters/pmt/hooks/fetch-users';
import teamSerializer from 'adapters/pmt/serializers/team';
import userSerializer from 'adapters/pmt/serializers/user';
import { assert } from 'chai';
import stubs from 'adapters/pmt/test-utils/stubs';

describe('PMT Hooks', () => {
  let fakeBaseStoreUrl;

  before(async () => {
    fakeBaseStoreUrl = 'http://mypmtstore.nl';
    const baseMock = nock(fakeBaseStoreUrl);

    baseMock.get('/departments').reply(200, { departments: stubs.departments });
    baseMock.get('/users').reply(200, { data: stubs.users });
  });

  describe('fetchTeams', () => {
    it('should conform to internal team contract', async () => {
      const actual = await fetchTeams(fakeBaseStoreUrl)();
      const expected = stubs.departments.map(teamSerializer);

      assert.deepEqual(actual, expected);
      assert.property(actual[0], 'externalId');
      assert.property(actual[0], 'name');
    });
  });

  describe('fetchUsers', () => {
    let hookResult;

    before(async () => (hookResult = await fetchUsers(fakeBaseStoreUrl)()));

    it('should set correct value for isActive property', async () => {
      assert.equal(hookResult[0].isActive, true);
      assert.equal(hookResult[2].isActive, false);
    });

    it('should set correct value for isAdmin property', async () => {
      assert.equal(hookResult[0].isAdmin, true);
      assert.equal(hookResult[1].isAdmin, false);
    });

    it('should conform to internal user contract', async () => {
      const expected = stubs.users.map(userSerializer);

      assert.deepEqual(hookResult, expected);
      assert.property(hookResult[0], 'externalId');
      assert.property(hookResult[0], 'username');
      assert.property(hookResult[0], 'email');
      assert.property(hookResult[0], 'firstName');
      assert.property(hookResult[0], 'lastName');
      assert.property(hookResult[0], 'dateOfBirth');
      assert.property(hookResult[0], 'phoneNum');
      assert.property(hookResult[0], 'isAdmin');
      assert.property(hookResult[0], 'isActive');
      assert.property(hookResult[0], 'teamId');
    });
  });
});
