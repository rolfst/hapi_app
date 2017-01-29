import * as service from '../services/invite-user';
import * as responseUtil from '../../../shared/utils/response';
import camelCaseKeys from '../../../shared/utils/camel-case-keys';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.createLogger('EMPLOYEE/handler/bulkInviteUsers');


export default async (req, reply) => {
  try {
    const rawPayload = { ...req.payload, ...req.params };
    const payload = camelCaseKeys(rawPayload);
    const message = { ...req.pre, ...req.auth };

    logger.info('Bulk-inviting users: ', { payload, message });
    const invitedUsers = await service.inviteUsers(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(invitedUsers) });
  } catch (err) {
    return reply(err);
  }
};
