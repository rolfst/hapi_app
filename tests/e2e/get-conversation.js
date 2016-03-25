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

    Conversation.create({
      type: 'PRIVATE',
      createdBy: user.id,
    }).then(conversation => {
      console.log('created', conversation);
      conversation = conversation;
    });
  });
});

it('GET /conversations/:id', () => {
  console.log(conversation);

  return server.inject({
    method: 'GET',
    url: `/conversations/${conversation.id}`,
    headers: {
      'X-API-Token': token,
    },
    credentials: { user },
  }).then(response => {
    console.log(response.result);
    assert.equal(response.statusCode, 200);
  });

  // assert.equal(1, 1);
});

// after(() => {
//   return User.destroy({
//     where: { email: 'testgebruiker@flex-appeal.nl' },
//   });
// });
