import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.getLogger('CORE/handler/viewNetwork');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };

    logger.info('Retrieving network information', { message });

    return reply({ data: responseUtil.toSnakeCase(req.pre.network) });
  } catch (err) {
    return reply(err);
  }
};
