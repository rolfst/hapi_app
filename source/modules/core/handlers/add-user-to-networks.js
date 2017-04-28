const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const organisationService = require('../services/organisation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    await organisationService
      .assertUserIsAdminInOrganisation(payload.organisationId, message.credentials.id);

    await organisationService
      .userHasRoleInOrganisation(
        organisationService.ERoleTypes.ANY,
        payload.organisationId,
        payload.userId
      );

    await organisationService.addUserToNetworks(payload, message);

    return reply({ data: responseUtil.toSnakeCase(true) });
  } catch (err) {
    return reply(err);
  }
};
