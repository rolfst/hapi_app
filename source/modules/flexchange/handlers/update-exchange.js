import { findNetworkById } from 'common/repositories/network';
import { updateExchangeById } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    updateExchangeById(req.params.exchangeId, req.payload)
      .then(exchange => exchange.reload())
      .then(exchange => reply({ success: true, data: exchange.toJSON() }))
      .catch(err => reply(err));
  });
};
