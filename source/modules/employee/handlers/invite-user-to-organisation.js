const createServicePayload = require('../../../shared/utils/create-service-payload');
const service = require('../services/invite-user');
const responseUtil = require('../../../shared/utils/response');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const invitedUser = await service.inviteUserToOrganisation(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(invitedUser) });
  } catch (err) {
    return reply(err);
  }
};
