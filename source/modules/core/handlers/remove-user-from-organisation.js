const createServicePayload = require('../../../shared/utils/create-service-payload');
const organisationService = require('../services/organisation');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);

    await organisationService.removeUserFromOrganisation(payload, message);

    return reply({ success: true });
  } catch (err) {
    return reply(err);
  }
};
