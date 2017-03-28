const R = require('ramda');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const flexchangeService = require('../services/flexchange');

const logger = require('../../../shared/services/logger')('FLEXCHANGE/handler/myShifts');

const transformItem = (item) => R.merge(
  R.omit(['teamId', 'exchangeId'], item),
  {
    exchange_id: item.exchangeId ? item.exchangeId.toString() : null,
    team_id: item.teamId ? item.teamId.toString() : null,
  });

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Listing personal shifts', { payload, message });
    const items = await flexchangeService.listMyShifts(payload, message);
    const response = items.map(transformItem);

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
