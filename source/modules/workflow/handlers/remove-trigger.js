const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowService = require('../services/workflow');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    const data = await workflowService.removeTrigger(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
