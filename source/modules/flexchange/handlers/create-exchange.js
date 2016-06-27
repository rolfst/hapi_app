import { createExchange } from 'modules/flexchange/repositories/exchange';
import { createValuesForExchange } from 'modules/flexchange/repositories/exchange-value';
import hasIntegration from 'common/utils/network-has-integration';
import analytics from 'common/services/analytics';
import newExchangeEvent from 'common/events/new-exchange-event';

export default (req, reply) => {
  if (hasIntegration(req.pre.network)) {
    // Execute integration logic with adapter
  }

  createExchange(req.auth.credentials.id, req.pre.network.id, req.payload)
    .then(exchange => {
      if (['TEAM', 'USER'].includes(exchange.type)) {
        createValuesForExchange(exchange.id, JSON.parse(req.payload.values));
      }

      analytics.track(newExchangeEvent(req.pre.network, exchange));

      return reply({ success: true, data: exchange });
    })
    .catch(err => {
      console.log('Error creating exchange', err);
      return reply(err);
    });
};
