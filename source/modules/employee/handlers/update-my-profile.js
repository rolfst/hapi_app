import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  const loggedUser = req.auth.credentials;
  const network = req.pre.network;
  const promises = [];

  if (hasIntegration(network)) {
    const adapter = createAdapter(network, req.auth.artifacts.integrations);

    const pmtPromise = adapter
      .updateUser(network.externalId, loggedUser.id, req.payload)
      .then(result => result);

    promises.push(pmtPromise);
  }

  const flexAppealPromise = loggedUser.update(req.payload);
  promises.push(flexAppealPromise);

  return Promise.all(promises)
    .then(() => loggedUser.reload().then(user => {
      user.set('scope', network.NetworkUser.roleType);

      return user;
    }))
    .then(user => reply({ success: true, data: user.toJSON() }))
    .catch(err => console.log('Error updating logged user', err));
};
