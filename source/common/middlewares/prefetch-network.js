import _ from 'lodash';
import Boom from 'boom';
import { findNetworkById } from 'common/repositories/network';

export default (req, reply) => {
  return findNetworkById(req.params.networkId).then(network => {
    const selectedNetwork = _.find(req.auth.credentials.Networks, { id: network.id });

    if (!selectedNetwork) throw Boom.forbidden('User does not belong to the network.');

    const deletedFromNetwork = selectedNetwork.NetworkUser.deletedAt !== null;
    if (deletedFromNetwork) throw Boom.forbidden('User is deleted from network.');

    return reply(network);
  }).catch(err => reply(err));
};
