import * as service from '../services/invite-user';
import * as responseUtil from '../../../shared/utils/response';

export default async (req, reply) => {
  try {
    const message = { ...req.pre, ...req.auth };
    const payload = { ...req.query, ...req.payload, ...req.params };
    const invitedUser = await service.inviteUser(payload, message);

    return reply({ success: true, data: responseUtil.toSnakeCase(invitedUser) });
  } catch (err) {
    console.log('Error inviting an user', err);
    return reply(err);
  }
};
