const createServicePayload = require('../../../shared/utils/create-service-payload');
const messageService = require('../services/message');
const responseUtil = require('../../../shared/utils/response');
const createError = require('../../../shared/utils/create-error');
const organisationService = require('../../core/services/organisation');
const { EMessageTypes } = require('../definitions');

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

    payload.parentType = 'organisation';
    payload.parentId = payload.organisationId;
    payload.messageType = EMessageTypes.ORGANISATION;

    const organisationMessage = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(organisationMessage) });
  } catch (err) {
    return reply(err);
  }
};
