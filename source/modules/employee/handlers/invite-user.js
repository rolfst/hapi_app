import * as service from '../services/invite-user';
import * as responseUtil from '../../../shared/utils/response';
import * as Logger from '../../../shared/services/logger';

const logger = Logger.getLogger('EMPLOYEE/handler/inviteUser');

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.query, ...req.payload, ...req.params };

    logger.info('Inviting an user', { payload, message });
    const invitedUser = await service.inviteUser(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(invitedUser) });
  } catch (err) {
    return reply(err);
  }
};
