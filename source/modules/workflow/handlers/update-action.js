const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const workflowService = require('../services/workflow');
const organisationService = require('../../core/services/organisation');
const createError = require('../../../shared/utils/create-error');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    if (
      !await organisationService.userHasRoleInOrganisation(
        organisationService.ERoleTypes.ADMIN,
        payload.organisationId,
        message.credentials.id)
    ) {
      throw createError('403');
    }

    const data = await workflowService.updateAction(payload, message);

    return reply({ data: responseUtil.toSnakeCase(data) });
  } catch (err) {
    return reply(err);
  }
};
