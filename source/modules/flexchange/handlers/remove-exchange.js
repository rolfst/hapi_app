import { findNetworkById } from 'common/repositories/network';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    findExchangeById(req.params.exchangeId)
      .then(exchange => exchange.destroy())
      .then(() => reply('Successfully deleted exchange'))
      .catch(err => reply(err));
  });
};
