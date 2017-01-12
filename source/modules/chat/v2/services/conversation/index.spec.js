import { assert } from 'chai';
import sinon from 'sinon';
import * as conversationRepo from '../../repositories/conversation';
import * as messageRepo from '../../repositories/message';
import * as unit from './index';

describe('Service: Conversation Implementation (v2)', () => {
  describe('listConversations', () => {
    it('should return correct conversations', async () => {
      sinon.stub(conversationRepo, 'findByIds').returns(Promise.resolve([{
        id: '1',
        lastMessage: null,
      }, {
        id: '2',
        lastMessage: null,
      }]));

      sinon.stub(messageRepo, 'findForConversations').returns(Promise.resolve([{
        id: '1',
        conversationId: '1',
        text: 'Message in conversation #1',
      }, {
        id: '2',
        conversationId: '1',
        text: 'Another message in conversation #1',
      }]));

      const expected = [{
        id: '1',
        lastMessage: {
          id: '2',
          conversationId: '1',
          text: 'Another message in conversation #1',
        },
      }, {
        id: '2',
        lastMessage: null,
      }];

      const actual = await unit.listConversations({ include: '', conversationIds: ['1', '2'] });

      assert.deepEqual(actual, expected);
    });
  });
});
