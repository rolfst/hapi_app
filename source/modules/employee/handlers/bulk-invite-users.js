const createServicePayload = require('../../../shared/utils/create-service-payload');
const responseUtil = require('../../../shared/utils/response');
const inviteUserService = require('../services/invite-user');

module.exports = async (req, reply) => {
  try {
    const { payload, message } = createServicePayload(req);
    const invitedUsers = await inviteUserService.inviteUsers(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(invitedUsers) });
  } catch (err) {
    return reply(err);
  }
};
