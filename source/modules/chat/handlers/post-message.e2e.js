import { assert } from 'chai';
import inject from 'common/test-utils/inject';

import { postConversation } from 'common/services/conversation';

let conversation = null;

before(() => {
  return postConversation({
    type: 'PRIVATE',
    createdBy: global.authUser.id,
    users: [5, global.authUser.id],
  })
    .then(data => {
      conversation = data;
    });
});

it('POST /conversations/:id/messages', () => {
  return inject(global.server, global.authUser, {
    method: 'POST',
    url: `/conversations/${conversation.id}/messages`,
    token: global.authToken,
    payload: {
      text: 'Test message',
    },
  }).then(response => {
    const { data } = response.result;

    assert.equal(data.conversation.id, conversation.id);
    assert.equal(data.text, 'Test message');
    assert.equal(data.type, 'conversation_message');

    assert.equal(response.statusCode, 200);
  });
});
