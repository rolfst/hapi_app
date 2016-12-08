import * as syncService from '../services/sync';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.getLogger('INTEGRATIONS/handler/syncWithIntegrationPartner');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.payload, ...req.params };

    logger.info('Syncing network', { payload, message });
    await syncService.syncWithIntegrationPartner(payload, message);

    return reply({ data: { success: true } });
  } catch (err) {
    return reply(err);
  }
};