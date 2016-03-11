'use strict';

import Hapi from 'hapi';
import routes from 'routes/create-routes';

import ConversationUser from 'models/ConversationUser';

const server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 8000,
});

routes.map(route => server.route(route));

server.start(err => {
  if (err) {
    throw err;
  }
  console.log('Server running at:', server.info.uri);
});
