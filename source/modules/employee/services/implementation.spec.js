import { assert } from 'chai';
import * as impl from './implementation';

describe('Employee service implementation', () => {
  describe('getUsersWithoutPassword', () => {
    it('should return all members without password', async () => {
      const expectedUser = { username: 'expectedUser' };
      const userWithPassword = { username: 'UserWithPassword', password: 'hehe' };
      const excludedUser = { username: 'excludedUser', password: 'nope' };
      const allUsers = [expectedUser, userWithPassword, excludedUser];
      const matchingUsers = allUsers;
      const allUsersWithoutPasswords = [expectedUser];
      const expected = allUsersWithoutPasswords;

      const result = impl.getUsersWithoutPassword(allUsers, matchingUsers);

      assert.deepEqual(result, expected);
    });

    it('should only return all members from network when matching memberlist has more members',
      async () => {
        const expectedUser = { username: 'expectedUser' };
        const otherExpectedUser = { username: 'otherExpectUser' };
        const userWithPassword = { username: 'UserWithPassword', password: 'hehe' };
        const excludedUser = { username: 'excludedUser', password: 'nope' };
        const allExistingUsers = [expectedUser, userWithPassword, excludedUser];
        const matchingMembers = [expectedUser, otherExpectedUser, userWithPassword, excludedUser];
        const expected = [expectedUser];

        const result = impl.getUsersWithoutPassword(allExistingUsers, matchingMembers);

        assert.deepEqual(result, expected);
      });

    it('should only return all members from network without password when existing memberlist has more members', // eslint-disable-line
      async () => {
        const expectedUser = { username: 'expectedUser' };
        const otherMemberWithPassword = {
          username: 'othermemberwithpassword',
          password: 'otherpw' };
        const userWithPassword = { username: 'UserWithPassword', password: 'hehe' };
        const excludedUser = { username: 'excludedUser', password: 'nope' };
        const allUsers = [expectedUser, userWithPassword, excludedUser, otherMemberWithPassword];
        const matchingList = [expectedUser, excludedUser];
        const expected = [expectedUser];

        const result = impl.getUsersWithoutPassword(allUsers, matchingList);

        assert.deepEqual(result, expected);
      });
  });

  describe('getUsersWithPassword', () => {
    it('should return members from matching list', async () => {
      const expectedUser = { username: 'expectedUser' };
      const userWithPassword = { username: 'UserWithPassword', password: 'hehe' };
      const excludedUser = { username: 'excludedUser', password: 'nope' };
      const allUsers = [expectedUser, userWithPassword, excludedUser];
      const matchingUsers = allUsers;
      const expected = [userWithPassword];

      const result = impl.getUsersWithPassword(
        allUsers,
        matchingUsers,
        [excludedUser]);

      assert.deepEqual(result, expected);
    });

    it('should return only users when existingMember list is larger than matching members', // eslint-disable-line
      async () => {
        const userWithoutPassword = { username: 'expectedUser' };
        const expectedUser = { username: 'UserWithPassword', password: 'hehe' };
        const excludedUser = { username: 'excludedUser', password: 'nope' };
        const allUsers = [expectedUser, userWithoutPassword, excludedUser];
        const matchingUsers = [excludedUser, expectedUser];
        const expected = [expectedUser];

        const result = impl.getUsersWithPassword(allUsers, matchingUsers, [excludedUser]);

        assert.deepEqual(result, expected);
      });

    it('should only return all members from network when matching memberlist has more members',
      async () => {
        const userWithoutPassword = { username: 'expectedUser' };
        const otherUserWithoutPassword = { username: 'otherExpectUser' };
        const expectedUser = { username: 'UserWithPassword', password: 'hehe' };
        const excludedUser = { username: 'excludedUser', password: 'nope' };
        const allExistingUsers = [userWithoutPassword, expectedUser, excludedUser];
        const matchingMembers = [
          userWithoutPassword,
          otherUserWithoutPassword,
          expectedUser,
          excludedUser];
        const expected = [expectedUser];

        const result = impl.getUsersWithPassword(allExistingUsers, matchingMembers, [excludedUser]);

        assert.equal(result.length, 1);
        assert.deepEqual(result, expected);
      });
  });
});
