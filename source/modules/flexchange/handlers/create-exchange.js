import { findNetworkById } from 'common/repositories/network';
import { createExchange } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';
import respondWithItem from 'common/utils/respond-with-item';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    createExchange(req.auth.credentials.id, req.params.networkId, req.payload)
      .then(exchange => reply({ success: true, data: exchange }))
      .catch(err => reply(err));
  });
};
