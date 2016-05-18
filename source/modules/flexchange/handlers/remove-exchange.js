import { findNetworkById } from 'common/repositories/network';
import { deleteExchangeById } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    deleteExchangeById(req.params.exchangeId)
      .then(() => reply({ success: true }))
      .catch(err => reply(err));
  });
};
