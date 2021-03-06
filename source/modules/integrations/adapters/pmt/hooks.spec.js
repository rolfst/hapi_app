const { assert } = require('chai');
const sinon = require('sinon');
const client = require('./client');
const blueprints = require('./test-utils/blueprints');
const fetchTeams = require('./hooks/fetch-teams');
const fetchUsers = require('./hooks/fetch-users');
const teamSerializer = require('./serializers/team');

describe('PMT Hooks', () => {
  const fakeBaseStoreUrl = 'http://mypmtstore.nl';

  describe('fetchTeams', () => {
    it('should conform to internal team contract', async () => {
      const responseStub = { payload: { departments: blueprints.departments } };
      sinon.stub(client, 'get').returns(Promise.resolve(responseStub));

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
      sinon.stub(client, 'get').returns(Promise.resolve({ payload: { data: blueprints.users } }));

      hookResult = await fetchUsers(fakeBaseStoreUrl)();
    });

    after(() => client.get.restore());

    it('should set correct value for isActive property', async () => {
      assert.equal(hookResult[0].isActive, true);
      assert.equal(hookResult[2].isActive, false);
    });

    it('should set correct value for isAdmin property', async () => {
      assert.equal(hookResult[0].roleType, 'EMPLOYEE');
      assert.equal(hookResult[1].roleType, 'EMPLOYEE');
    });

    it('should conform to internal user contract', async () => {
      assert.property(hookResult[0], 'externalId');
      assert.property(hookResult[0], 'username');
      assert.property(hookResult[0], 'email');
      assert.property(hookResult[0], 'firstName');
      assert.property(hookResult[0], 'lastName');
      assert.property(hookResult[0], 'integrationAuth');
      assert.property(hookResult[0], 'function');
      assert.property(hookResult[0], 'dateOfBirth');
      assert.property(hookResult[0], 'phoneNum');
      assert.property(hookResult[0], 'roleType');
      assert.property(hookResult[0], 'isActive');
      assert.property(hookResult[0], 'deletedAt');
      assert.property(hookResult[0], 'teamIds');
      assert.isArray(hookResult[0].teamIds);
    });
  });
});
