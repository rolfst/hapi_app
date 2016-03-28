import { assert } from 'chai';
import fetch from 'isomorphic-fetch';
import Conversation from 'models/Conversation';

import authenticate from 'tests/utils/authenticate';
import inject from 'tests/utils/inject';
import createServer from 'server';

const server = createServer(8000);

let token = null;
let user = null;
let conversation = null;

before(() => {
  return authenticate({}).then(({ user, token }) => {
    token = token, user = user;

    return Conversation.create({ type: 'PRIVATE', createdBy: user.id });
  }).then(createdConversation => {
    conversation = createdConversation;
  });
});

it('GET /conversations/:id', () => {
  return inject(server, user, {
    method: 'GET',
    url: `/conversations/${conversation.id}`,
    token
  }).then(response => {
      assert.deepEqual(response.result, {
        data: {
          type: 'conversation',
          id: conversation.id.toString(),
          created_at: conversation.created_at,
        },
      });

      assert.equal(response.statusCode, 200);
  });
});

after(() => {
  return Conversation.findById(conversation.id)
    .then(conversation => conversation.destroy());
});
