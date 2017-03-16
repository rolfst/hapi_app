const createServicePayload = require('../../../shared/utils/create-service-payload');
const syncService = require('../services/sync');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    syncService.syncWithIntegrationPartner(payload, message);

    return reply().code(202);
  } catch (err) {
    return reply(err);
  }
};
