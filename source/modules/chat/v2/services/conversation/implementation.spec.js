import { assert } from 'chai';
import * as unit from './implementation';

describe('Service: Conversation Implementation (v2)', () => {
  describe('mergeLastMessageWithConversation', () => {
    it('should return conversation with last message', () => {
      const objects = [{
        id: '1',
        sourceId: '2',
        objectType: 'message',
        parentId: '1',
        parentType: 'conversation',
      }, {
        id: '1',
        sourceId: '1',
        objectType: 'message',
        parentId: '1',
        parentType: 'conversation',
      }];

      const conversation = {
        id: '1',
        type: 'private',
      };

      const messages = [{
        id: '2',
        text: 'Last message in conversation #1',
      }, {
        id: '1',
        text: 'First message in conversation #1',
      }];

      const actual = unit.mergeLastMessageWithConversation(objects, messages, conversation);
      const expected = {
        id: '1',
        type: 'private',
        lastMessage: {
          id: '2',
          text: 'Last message in conversation #1',
        },
      };

      assert.deepEqual(actual, expected);
    });

    it('should return with null for lastMessage property if there are no messages found', () => {
      const objects = [{
        id: '1',
        sourceId: '2',
        objectType: 'message',
        parentId: '1',
        parentType: 'conversation',
      }, {
        id: '1',
        sourceId: '1',
        objectType: 'message',
        parentId: '1',
        parentType: 'conversation',
      }];

      const conversation = {
        id: '1',
        type: 'private',
      };

      const messages = [];

      const actual = unit.mergeLastMessageWithConversation(objects, messages, conversation);
      const expected = {
        id: '1',
        type: 'private',
        lastMessage: null,
      };

      assert.deepEqual(actual, expected);
    });
  });

  describe('addParticipantsToConversation', () => {
    it('should return conversations with participants as user objects', () => {
      const conversations = [{
        id: '1',
        type: 'private',
        participantIds: ['1', '2'],
      }];

      const participants = [{
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      }, {
        id: '2',
        firstName: 'Baz',
        lastName: 'Faggot',
      }];

      const expected = [{
        ...conversations[0],
        participants,
      }];

      assert.deepEqual(unit.addParticipantsToConversation(conversations, participants), expected);
    });

    it('should ignore users that cannot be found', () => {
      const conversations = [{
        id: '1',
        type: 'private',
        participantIds: ['1', '2'],
      }];

      const participants = [{
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
      }];

      const expected = [{
        ...conversations[0],
        participants,
      }];

      assert.deepEqual(unit.addParticipantsToConversation(conversations, participants), expected);
    });
  });
});
