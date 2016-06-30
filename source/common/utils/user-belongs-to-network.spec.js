import { assert } from 'chai';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('userBelongsToNetwork', () => {
  it('should check if user belongs to network', () => {
    const userFixture = {
      ...credentials,
      Networks: [{ name: 'Flex-Appeal', NetworkUser: { deletedAt: null } }],
    };

    assert.equal(userBelongsToNetwork(userFixture), true);
    assert.equal(userBelongsToNetwork({ ...userFixture, Networks: [] }), false);
  });
});
