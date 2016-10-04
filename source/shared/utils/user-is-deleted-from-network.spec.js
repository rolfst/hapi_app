import { assert } from 'chai';
import userIsDeletedFromNetwork from './user-is-deleted-from-network';

const credentials = {
  username: 'Johnnie', firstName: 'John', lastName: 'Doe', password: 'ihazswag',
};

describe('userIsDeletedFromNetwork', () => {
  it('returns true when deleted from network', () => {
    const userFixture = {
      ...credentials,
      Networks: [{ id: 1, name: 'Flex-Appeal', NetworkUser: { deletedAt: new Date() } }],
    };

    assert.equal(userIsDeletedFromNetwork(userFixture, 1), true);
  });

  it('returns false when not deleted from network', () => {
    const userFixture = {
      ...credentials,
      Networks: [{ id: 1, name: 'Flex-Appeal', NetworkUser: { deletedAt: null } }],
    };

    assert.equal(userIsDeletedFromNetwork(userFixture, 1), false);
  });

  it('returns false when user doesn\'t belong to a network', () => {
    const userFixture = {
      ...credentials,
      Networks: [],
    };

    assert.equal(userIsDeletedFromNetwork(userFixture, 1), false);
  });
});
