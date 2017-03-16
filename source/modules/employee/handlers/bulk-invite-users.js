const inviteUserService = require('../services/invite-user');
const responseUtil = require('../../../shared/utils/response');
const Logger = require('../../../shared/services/logger');

const logger = Logger.createLogger('EMPLOYEE/handler/bulkInviteUsers');


module.exports = async (req, reply) => {
  try {
    const payload = { userIds: req.payload.user_ids };
    const message = { ...req.pre, ...req.auth };

    logger.info('Bulk-inviting users: ', { payload, message });
    const invitedUsers = await inviteUserService.inviteUsers(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(invitedUsers) });
  } catch (err) {
    return reply(err);
  }
};
