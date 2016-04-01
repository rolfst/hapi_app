/* eslint no-console: "off" */
import { assert } from 'chai';
import Conversation from 'models/Conversation';
import formatDate from 'utils/formatDate';

import authenticate from '__tests__/utils/authenticate';
import inject from '__tests__/utils/inject';
import createServer from 'server';

const server = createServer(8000);

let token = null;
let user = null;
let conversation = null;

before(() => {
  return authenticate({}).then(({ authUser, authToken }) => {
    token = authToken;
    user = authUser;

    return Conversation.create({ type: 'PRIVATE', createdBy: authUser.id });
  }).then(createdConversation => {
    createdConversation.addUsers([user.id]);
    conversation = createdConversation;
  });
});

it('GET /conversations/:id', () => {
  return inject(server, user, {
    method: 'GET',
    url: `/conversations/${conversation.id}`,
    token,
  }).then(response => {
    assert.deepEqual(response.result, {
      data: {
        type: 'conversation',
        id: conversation.id.toString(),
        created_at: formatDate(conversation.created_at),
      },
    });

    assert.equal(response.statusCode, 200);
  });
});

after(() => {
  return Conversation.findById(conversation.id)
    .then(foundConversation => foundConversation.destroy());
});
