import Boom from 'boom';
import chatRoutes from 'modules/chat/routes/create-routes';
import createAdapter from 'integrations/create-adapter';

const defaultRoutes = [
  {
    method: 'GET',
    path: '/integrations/{name}/sync',
    handler: (req, reply) => {
      try {
        const adapter = createAdapter(req.params.name).initialSync();

        reply({ message: 'Succesfully synced integration.' }).code(202);
      } catch (err) {
        reply(Boom.badRequest(err));
      }
    },
    config: {
      auth: 'default',
    },
  },
];

export default [...defaultRoutes, ...chatRoutes];
