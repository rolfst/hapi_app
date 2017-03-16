const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');
const flexchangeService = require('../services/flexchange');

const logger = Logger.createLogger('FLEXCHANGE/handler/respondedTo');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Listing exchange where is responded to for user', { message });
    const result = await flexchangeService.listRespondedTo({}, message);

    return reply({ data: responseUtil.serialize(result) });
  } catch (err) {
    return reply(err);
  }
};
