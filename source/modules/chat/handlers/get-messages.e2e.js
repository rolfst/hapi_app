import { assert } from 'chai';
import { getRequest } from 'common/test-utils/request';

import { createConversation, deleteAllConversationsForUser } from 'modules/chat/repositories/conversation';
import { createMessage } from 'modules/chat/repositories/message';

let conversation;
const timestamp = new Date().getTime();

describe('Get messages', () => {
  before(() => {
    return createConversation('PRIVATE', global.authUser.id, [2, global.authUser.id])
      .then(createdConversation => {
        conversation = createdConversation;

        return Promise.all([
          createMessage(conversation.id, global.authUser.id, `Test bericht 1${timestamp}`),
          createMessage(conversation.id, global.authUser.id, `Test bericht 2${timestamp}`),
          createMessage(conversation.id, 2, `Test bericht 3${timestamp}`),
        ]);
      });
  });

  it('should return messages for conversation', () => {
    return getRequest(`/conversations/${conversation.id}/messages`)
      .then(response => {
        const { data } = response.result;

        assert.lengthOf(data, 3);
        assert.equal(response.statusCode, 200);
      });
  });

  after(() => {
    return deleteAllConversationsForUser(global.authUser);
  });
});
