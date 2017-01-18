import { assert } from 'chai';
import * as unit from './implementation';

describe('Service: Conversation Implementation (v2)', () => {
  describe('conversationWithLastMessage', () => {
    it('should return conversation with last message', () => {
      const conversation = {
        id: '1',
        type: 'private',
      };

      const messages = [{
        id: '2',
        conversationId: '1',
        text: 'Last message in conversation #1',
      }, {
        id: '1',
        conversationId: '1',
        text: 'First message in conversation #1',
      }];

      const expected = {
        id: '1',
        type: 'private',
        lastMessage: {
          id: '2',
          conversationId: '1',
          text: 'Last message in conversation #1',
        },
      };

      assert.deepEqual(unit.conversationWithLastMessage(() => messages, conversation), expected);
    });

    it('should return with last message null if there are no messages found', () => {
      const conversation = {
        id: '1',
        type: 'private',
      };

      const messages = [];

      const expected = {
        id: '1',
        type: 'private',
        lastMessage: null,
      };

      assert.deepEqual(unit.conversationWithLastMessage(() => messages, conversation), expected);
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
