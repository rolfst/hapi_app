const R = require('ramda');
const syncService = require('../services/sync');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('INTEGRATIONS/handler/syncWithIntegrationPartner');

module.exports = async (req, reply) => {
  try {
    const payload = R.merge(req.params, req.payload);
    const message = R.merge(req.pre, req.auth);

    logger.info('Syncing network', { payload, message });
    syncService.syncWithIntegrationPartner(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
