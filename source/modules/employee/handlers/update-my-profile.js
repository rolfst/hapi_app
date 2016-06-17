import createAdapter from 'adapters/create-adapter';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  const loggedUser = req.auth.credentials;

  const promises = [];

  if (hasIntegration(req.pre.network)) {
    const adapter = createAdapter(req.pre.network, req.auth.artifacts.integrations);

    const pmtPromise = adapter
      .updateUser(req.pre.network.externalId, loggedUser.id, req.payload)
      .then(result => result);

    promises.push(pmtPromise);
  }

  const flexAppealPromise = loggedUser.update(req.payload);
  promises.push(flexAppealPromise);

  return Promise.all(promises)
    .then(() => loggedUser.reload())
    .then(user => reply({ success: true, data: user.toJSON() }))
    .catch(err => console.log('Error updating logged user', err));
};
