import { assert } from 'chai';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('userBelongsToNetwork', () => {
  it('check if user belongs to any network', () => {
    const userFixture = {
      ...credentials,
      Networks: [{ id: 1, name: 'Flex-Appeal', NetworkUser: { deletedAt: null } }],
    };

    assert.equal(userBelongsToNetwork(userFixture), true);
    assert.equal(userBelongsToNetwork({ ...userFixture, Networks: [] }), false);
  });

  it('check if user belongs to the given network', () => {
    const userFixture = {
      ...credentials,
      Networks: [{ id: 1, name: 'Flex-Appeal', NetworkUser: { deletedAt: null } }],
    };

    assert.equal(userBelongsToNetwork(userFixture, 1), true);
    assert.equal(userBelongsToNetwork(userFixture, 2), false);
  });
});
