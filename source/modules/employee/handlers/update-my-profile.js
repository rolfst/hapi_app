import createAdapter from 'adapters/create-adapter';
import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  const loggedUser = req.auth.credentials;

  findNetworkById(req.params.networkId).then(network => {
    // TODO: Check if user can access this network
    const promises = [];

    if (hasIntegration(network)) {
      const adapter = createAdapter(network);

      const pmtPromise = adapter
        .updateUser(network.externalId, loggedUser.id, req.payload)
        .then(result => result);

      promises.push(pmtPromise);
    }

    const flexAppealPromise = loggedUser.update(req.payload);
    promises.push(flexAppealPromise);

    return promises;
  })
  .spread(() => loggedUser.reload())
  .then(user => reply({ success: true, data: user.toJSON() }));
};
