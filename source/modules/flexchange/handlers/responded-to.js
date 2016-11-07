import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';
import * as flexchangeService from '../services/flexchange';

const logger = Logger.getLogger('FLEXCHANGE/handler/respondedTo');

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
