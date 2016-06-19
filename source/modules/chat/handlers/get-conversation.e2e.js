import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';

import { createConversation } from 'modules/chat/repositories/conversation';
import { createMessage } from 'modules/chat/repositories/message';

let conversation = null;
const timestamp = new Date().getTime();

describe('Get conversation', () => {
  before(() => {
    return createConversation('PRIVATE', global.authUser.id, [64, global.authUser.id])
      .then(data => {
        conversation = data;

        return Promise.all([
          createMessage(conversation.id, global.authUser.id, `Test bericht 1${timestamp}`),
          createMessage(conversation.id, global.authUser.id, `Test bericht 2${timestamp}`),
          createMessage(conversation.id, 2, `Test bericht 3${timestamp}`),
          createMessage(conversation.id, 2, `Test bericht 4${timestamp}`),
        ]);
      });
  });

  it('should return correct values', () => {
    return getRequest(`/v1/chats/conversations/${conversation.id}`)
      .then(response => {
        const { data } = response.result;

        assert.equal(data.id, conversation.id);
        assert.equal(data.users[0].id, 64);
        assert.equal(data.users[1].id, global.authUser.id);
        assert.equal(response.statusCode, 200);
      });
  });

  it('should include messages in conversations', () => {
    return getRequest(`/v1/chats/conversations/${conversation.id}?include=messages`)
      .then(response => {
        const { data } = response.result;

        assert.equal(data.id, conversation.id);
        assert.lengthOf(data.messages, 4);
        assert.equal(response.statusCode, 200);
      });
  });

  after(() => {
    return conversation.destroy();
  });
});
