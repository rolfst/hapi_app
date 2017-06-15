const responseUtil = require('../../../shared/utils/response');
const createServicePayload = require('../../../shared/utils/create-service-payload');
const organisationService = require('../services/organisation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    await organisationService
      .userHasRoleInOrganisation(
        payload.organisationId,
        payload.userId,
        organisationService.ERoleTypes.ANY
      );

    await organisationService.removeUserFromNetworks(payload, message);

    return reply({ data: responseUtil.toSnakeCase(true) });
  } catch (err) {
    return reply(err);
  }
};
