import _ from 'lodash';
import { findActivitiesForSource } from 'common/repositories/activity';
import { findExchangeById } from 'modules/flexchange/repositories/exchange';

export default async (req, reply) => {
  try {
    const exchange = await findExchangeById(req.params.exchangeId);
    const values = await findActivitiesForSource(exchange);
    const mapModelToJSON = activityModel => activityModel.toJSON();

    const activities = _
      .chain(values)
      .sortBy('date')
      .map(mapModelToJSON)
      .value();

    return reply({ data: activities });
  } catch (err) {
    console.log('Error loading exchange activity feed:', err);
    return reply(err);
  }
};
