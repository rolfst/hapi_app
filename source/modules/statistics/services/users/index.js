import * as Logger from '../../../../shared/services/logger';
import * as networkService from '../../../core/services/network';

/**
 * @module modules/statistics/services/user
 */

const logger = Logger.getLogger('STATISTICS/service/user');

export async function getTotalUserCount(payload, message) {
  logger.info('retrieving total active users in network', { payload, message });

  const totalUserCount = await networkService.getTotalUserCount(payload, message);

  return { data: { userCount: totalUserCount } };
}
