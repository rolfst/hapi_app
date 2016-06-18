import { updateExchangeById } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';

export default (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  return updateExchangeById(req.params.exchangeId, req.payload)
    .then(exchange => exchange.reload())
    .then(exchange => reply({ success: true, data: exchange.toJSON() }))
    .catch(err => reply(err));
};
