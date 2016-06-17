import _ from 'lodash';
import Boom from 'boom';

export default (req, reply) => {
  try {
    const networkId = parseInt(req.params.networkId, 10);
    const selectedNetwork = _.find(req.auth.credentials.Networks, { id: networkId });

    if (!selectedNetwork) throw Boom.forbidden('User does not belong to the network.');

    const deletedFromNetwork = selectedNetwork.NetworkUser.deletedAt !== null;
    if (deletedFromNetwork) throw Boom.forbidden('User is deleted from network.');

    return reply(selectedNetwork);
  } catch (err) {
    if (!err.isBoom) console.log('Error when prefetching network', err);
    return reply(err);
  }
};
