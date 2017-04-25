const createServicePayload = require('../../../shared/utils/create-service-payload');
const messageService = require('../services/message');
const responseUtil = require('../../../shared/utils/response');
const organisationService = require('../../core/services/organisation');
const { EMessageTypes } = require('../definitions');
const { ERoleTypes } = require('../../core/definitions');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    await organisationService
      .userHasRoleInOrganisation(ERoleTypes.ANY, payload.organisationId, message.credentials.id);

    payload.parentType = 'organisation';
    payload.parentId = payload.organisationId;
    payload.messageType = EMessageTypes.ORGANISATION;

    const organisationMessage = await messageService.create(payload, message);

    return reply({ data: responseUtil.toSnakeCase(organisationMessage) });
  } catch (err) {
    return reply(err);
  }
};
