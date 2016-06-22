import { assert } from 'chai';
import { selectNetworkForUser } from 'common/middlewares/prefetch-network';

describe('selectNetworkForUser', () => {
  const user = {
    firstName: 'John',
    Networks: [
      { id: 1, name: 'My network', NetworkUser: { deletedAt: null } },
      { id: 2, name: 'My old network', NetworkUser: { deletedAt: new Date() } },
    ],
  };

  it('should return the selected network', () => {
    const actual = selectNetworkForUser(user, 1);
    assert.deepEqual(actual, user.Networks[0]);
  });

  it('should fail when user doesnt belong to the selected network', () => {
    const actual = () => selectNetworkForUser(user, 3);
    assert.throws(actual, Error);
  });

  it('should fail when user is deleted from selected network', () => {
    const actual = () => selectNetworkForUser(user, 2);
    assert.throws(actual, Error);
  });
});
