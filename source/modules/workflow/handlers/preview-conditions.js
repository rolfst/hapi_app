const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowExecutor = require('../services/executor');

module.exports = async (req, reply) => {
  try {
    const { payload } = createServicePayload(req);

    const data =
      await workflowExecutor.previewConditions(payload.organisationId, payload.conditions);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
