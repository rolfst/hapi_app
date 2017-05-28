const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowExecutor = require('../services/executor');
const organisationService = require('../../core/services/organisation');
const createError = require('../../../shared/utils/create-error');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    if (
      !(await organisationService.userHasRoleInOrganisation(
        payload.organisationId,
        message.credentials.id,
        organisationService.ERoleTypes.ADMIN))
    ) {
      throw createError('403');
    }

    const data =
      await workflowExecutor.previewConditions(payload.organisationId, payload.conditions);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
