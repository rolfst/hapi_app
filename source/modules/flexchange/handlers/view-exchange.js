import { findNetworkById } from 'common/repositories/network';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';
import hasIntegration from 'common/utils/network-has-integration';
import respondWithItem from 'common/utils/respond-with-item';
import dispatch from 'common/utils/dispatcher';
import exchangeWasCreated from 'modules/flexchange/events/exchange-was-created';

export default (req, reply) => {
  // TODO: Add authorization if user can access the network


  findNetworkById(req.params.networkId).then(network => {
    if (hasIntegration(network)) {
      // Execute integration logic with adapter
    }

    findExchangeById(req.params.exchangeId)
      .then(exchange => reply(respondWithItem(exchange)))
      .catch(err => {
        console.log(err);
        reply(err);
      });
  });
};
