'use strict';

import Hapi from 'hapi';
import routes from 'routes/create-routes';
import authenticator from 'middlewares/authenticator';

const server = new Hapi.Server();

server.connection({
  host: 'localhost',
  port: 8000,
  routes: {
    cors: true,
  },
});

server.auth.scheme('jwt', authenticator);
server.auth.strategy('default', 'jwt');
server.auth.default('default');

server.ext('onRequest', (req, reply) => {
  process.env.BASE_URL = `${req.connection.info.protocol}://${req.info.host}`;
  return reply.continue();
});

// Accept CORS requests
server.ext('onPreResponse', (req, reply) => {
  const headers = 'Origin, X-API-Token, Content-Type, Accept';

	if (req.response.isBoom) {
		return reply(req.response.output.payload)
			.code(req.response.output.statusCode)
			.header('Access-Control-Allow-Origin', '*')
			.header('Access-Control-Allow-Headers', headers);
	}

	req.response.header('Access-Control-Allow-Origin', '*');
	req.response.header('Access-Control-Allow-Headers', headers);

	reply.continue();
});

routes.map(route => server.route(route));

server.start(err => {
  if (err) throw err;

  console.log('Server running at:', server.info.uri);
});
