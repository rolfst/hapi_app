import { assert } from 'chai';
import fetch from 'isomorphic-fetch';
import Conversation from 'models/Conversation';

import createServer from 'server';

const server = createServer(8000);

let token = null;
let user = null;
let conversation = null;

const authenticate = () => {
  return fetch('https://test.api.flex-appeal.nl/v1/authorize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ruben@flex-appeal.nl', password: 'admin' }),
  }).then(response => response.json())
    .then(json => json);
}

before(() => {
  return authenticate().then(json => {
    token = json.data.access_token;
    user = json.data.user;

    return Conversation.create({ type: 'PRIVATE', createdBy: user.id });
  }).then(createdConversation => {
    conversation = createdConversation;
  });
});

it('GET /conversations/:id', () => {
  return server.inject({
    method: 'GET',
    url: `/conversations/${conversation.id}`,
    headers: {
      'X-API-Token': token,
    },
    credentials: { user },
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
