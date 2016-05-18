import Boom from 'boom';
import chatRoutes from 'modules/chat/routes/create-routes';
import flexchangeRoutes from 'modules/flexchange/routes/create-routes';
import createAdapter from 'adapters/create-adapter';

const defaultRoutes = [
  {
    method: 'GET',
    path: '/adapters/{id}/sync',
    handler: (req, reply) => {
      try {
        createAdapter(req.params.id).initialSync();

        reply({ message: 'Succesfully synced integration.' }).code(202);
      } catch (err) {
        reply(Boom.badRequest(err));
      }
    },
    config: {
      auth: 'default',
    },
  }, {
    method: 'GET',
    path: '/adapters/event',
    handler: (req, reply) => {
      try {
        const eventTypes = ['NEW_STORE', 'NEW_EMPLOYEE', 'UPDATE_EMPLOYEE'];

        if (!eventTypes.includes(req.query.type)) return reply({ message: 'OK' });

        createAdapter(req.auth.credentials.integration.id).initialSync();

        return reply({ message: 'OK' });
      } catch (err) {
        return reply(Boom.badRequest(err));
      }
    },
    config: {
      auth: 'integration',
    },
  },
];

export default [...defaultRoutes, ...chatRoutes, ...flexchangeRoutes];
