import { findNetworkById } from 'common/repositories/network';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    // Get exchanges for current logged user
    reply('Not implemented yet.');
  });
}
