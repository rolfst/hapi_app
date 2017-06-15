const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowService = require('../services/workflow');

const logger = require('../../../shared/services/logger')('workflow/handler');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Fetching workflow', { payload, message });

    const data = await workflowService.fetchOne(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
