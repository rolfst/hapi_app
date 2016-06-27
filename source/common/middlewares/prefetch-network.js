import Boom from 'boom';
import selectNetwork from 'common/utils/select-network';

export const selectNetworkForUser = (user, networkIdToSelect) => {
  const selectedNetwork = selectNetwork(user.Networks, networkIdToSelect);

  if (!selectedNetwork) throw new Error('User does not belong to the network.');

  const deletedFromNetwork = selectedNetwork.NetworkUser.deletedAt !== null;
  if (deletedFromNetwork) throw new Error('User is deleted from network.');

  return selectedNetwork;
};

export default (req, reply) => {
  try {
    const networkId = parseInt(req.params.networkId, 10);
    const selectedNetwork = selectNetworkForUser(req.auth.credentials, networkId);

    return reply(selectedNetwork);
  } catch (err) {
    return reply(Boom.forbidden(err.message));
  }
};
