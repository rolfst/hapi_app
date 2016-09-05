import sinon from 'sinon';
import client from 'adapters/pmt/client';
import fetchTeams from 'adapters/pmt/hooks/fetch-teams';
import fetchUsers from 'adapters/pmt/hooks/fetch-users';
import teamSerializer from 'adapters/pmt/serializers/team';
import userSerializer from 'adapters/pmt/serializers/user';
import { assert } from 'chai';
import blueprints from 'adapters/pmt/test-utils/blueprints';

describe('PMT Hooks', () => {
  const fakeBaseStoreUrl = 'http://mypmtstore.nl';

  describe('fetchTeams', () => {
    it('should conform to internal team contract', async () => {
      sinon.stub(client, 'get').returns(Promise.resolve({ departments: blueprints.departments }));

      const actual = await fetchTeams(fakeBaseStoreUrl)();
      const expected = blueprints.departments.map(teamSerializer);

      assert.deepEqual(actual, expected);
      assert.property(actual[0], 'externalId');
      assert.property(actual[0], 'name');

      client.get.restore();
    });
  });

  describe('fetchUsers', () => {
    let hookResult;

    before(async () => {
      sinon.stub(client, 'get').returns(Promise.resolve({ data: blueprints.users }));

      hookResult = await fetchUsers(fakeBaseStoreUrl)();
    });

    after(() => client.get.restore());

    it('should set correct value for isActive property', async () => {
      assert.equal(hookResult[0].isActive, true);
      assert.equal(hookResult[2].isActive, false);
    });

    it('should set correct value for isAdmin property', async () => {
      assert.equal(hookResult[0].isAdmin, true);
      assert.equal(hookResult[1].isAdmin, false);
    });

    it('should conform to internal user contract', async () => {
      const expected = blueprints.users.map(userSerializer);

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
