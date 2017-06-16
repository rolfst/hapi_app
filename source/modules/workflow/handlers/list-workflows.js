const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowService = require('../services/workflow');

const logger = require('../../../shared/services/logger')('workflow/handler');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    logger.debug('Fetching workflow stats', { payload, message });

    const [data, counts] = await Promise.all([
      workflowService.listWorkflows(payload, message),
      workflowService.countWorkflows(payload, message),
    ]);

    return reply({
      data: responseUtil.toSnakeCase(data),
      meta: {
        pagination: {
          limit: payload.limit,
          offset: payload.offset,
          total_count: counts.totalCount,
        },
        pending_count: counts.pendingCount,
        processed_count: counts.processedCount,
      },
    });
  } catch (err) {
    return reply(err);
  }
};
