import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  // TODO: Update user for integration.

  const loggedUser = req.auth.credentials;

  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      const adapter = createAdapter(network.Integrations[0].id);

      return adapter
        .updateUser(loggedUser.id, req.payload)
        .then(shifts => reply({ data: shifts }));
    }
    // const network = loggedUser.getNetwork(req.params.networkId);
    // console.log(hasIntegration(network));
  });

  // return loggedUser
  //   .update(req.payload)
  //   .then(user => user.reload())
  //   .then(user => reply({ success: true, data: user.toJSON() }));
};
