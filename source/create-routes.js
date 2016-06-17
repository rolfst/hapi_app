import Boom from 'boom';
import authenticationRoutes from 'modules/authentication/create-routes';
import employeeRoutes from 'modules/employee/create-routes';
import chatRoutes from 'modules/chat/create-routes';
import flexchangeRoutes from 'modules/flexchange/create-routes';
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
      auth: 'jwt',
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

export default [
  ...defaultRoutes,
  ...chatRoutes,
  ...flexchangeRoutes,
  ...employeeRoutes,
  ...authenticationRoutes,
];
