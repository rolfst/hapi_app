import { assert } from 'chai';
import { createUser } from 'common/repositories/user';
import userBelongsToNetwork from 'common/utils/user-belongs-to-network';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('userBelongsToNetwork', () => {
  let user;

  before(async () => {
    const createdUser = await createUser(credentials);
    user = createdUser;
  });

  after(() => user.destroy());

  it('should check if user belongs to network', () => {
    assert.equal(userBelongsToNetwork(global.users.admin), true);
    assert.equal(userBelongsToNetwork(user), false);
  });
});
