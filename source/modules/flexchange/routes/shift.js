import createAdapter from 'integrations/create-adapter';
import { findNetworkById } from 'common/repositories/network';

export default [
  {
    method: 'GET',
    path: '/v2/networks/{id}/users/me/shifts',
    handler: require('modules/flexchange/handlers/my-shifts'),
    config: { auth: 'default' },
  }, {
    method: 'GET',
    path: '/v2/networks/{networkId}/shifts/{shiftId}/available',
    handler: (req, reply) => {
      // TODO: add authorization if user can access the network
      // TODO: add check to check if network has integration enabled or not
      findNetworkById(req.params.networkId).then(network => {
        const adapter = createAdapter(network.Integrations[0].id);

        return adapter
          .usersAvailableForShift(network.externalId, req.params.shiftId)
          .then(users => reply({ data: users }));
      });
    },
    config: {
      auth: 'default',
    },
  }, {
    method: 'PATCH',
    path: '/v2/networks/{networkId}/exchanges/{shiftId}',
    handler: (req, reply) => {
      // TODO: add authorization if user can access the network
      // TODO: add check to check if network has integration enabled or not
      findNetworkById(req.params.networkId).then(network => {
        const adapter = createAdapter(network.Integrations[0].id);

        const actions = {
          accept: adapter.acceptExchange,
          decline: adapter.declineExchange,
        };

        const hook = actions[req.payload.action];

        return hook(network.externalId, req.params.shiftId)
          .then(success => {
            if (!success) throw Error(`Could not ${req.payload.action} the shift.`);

            reply({ success: true });
          });
      });
    },
    config: {
      auth: 'default',
    },
  },
];
