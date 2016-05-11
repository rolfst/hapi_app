import createAdapter from 'integrations/create-adapter';
import { findNetworkById } from 'common/repositories/network';

export default [
  {
    method: 'GET',
    path: '/networks/{id}/users/me/shifts',
    handler: (req, reply) => {
      // TODO: add authorization if user can access the network
      // TODO: add check to check if network has integration enabled or not with adapter
      const adapter = createAdapter(req.params.id);

      findNetworkById(req.params.id).then(network => {
        return adapter
          .myShifts(network.externalId)
          .then(shifts => reply({ data: shifts }));
      });
    },
    config: {
      auth: 'default',
    },
  }, {
    method: 'GET',
    path: '/networks/{networkId}/shifts/{shiftId}/available',
    handler: (req, reply) => {
      // TODO: add authorization if user can access the network
      // TODO: add check to check if network has integration enabled or not
      const adapter = createAdapter(req.params.networkId);

      findNetworkById(req.params.networkId).then(network => {
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
    path: '/networks/{networkId}/exchanges/{shiftId}',
    handler: (req, reply) => {
      // TODO: add authorization if user can access the network
      // TODO: add check to check if network has integration enabled or not
      const adapter = createAdapter(req.params.networkId);

      findNetworkById(req.params.networkId).then(network => {
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
