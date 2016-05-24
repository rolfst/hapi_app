import { findNetworkById } from 'common/repositories/network';
import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    createExchange(req.auth.credentials.id, req.params.networkId, req.payload)
      .then(exchange => {
        if (['TEAM', 'USER'].includes(exchange.type)) {
          createValuesForExchange(exchange.id, JSON.parse(req.payload.values));
        }

        reply({ success: true, data: exchange });
      })
      .catch(err => {
        console.log(err);
        reply(err);
      });
  });
};
