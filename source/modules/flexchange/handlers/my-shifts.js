const { omit } = require('lodash');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/myShifts');

const transformItem = item => ({
  ...omit(item, 'teamId', 'exchangeId'),
  exchange_id: item.exchangeId ? item.exchangeId.toString() : null,
  team_id: item.teamId ? item.teamId.toString() : null,
});

module.exports = async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Listing personal shifts', { message });
    const items = await flexchangeService.listMyShifts({}, message);
    const response = items.map(transformItem);

    return reply({ data: response });
  } catch (err) {
    return reply(err);
  }
};
