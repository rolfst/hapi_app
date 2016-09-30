import * as service from '../services/invite-user';
import * as responseUtil from '../../../shared/utils/response';


export default async (req, reply) => {
  const { pre, auth } = req;
  const message = { ...pre, ...auth };

  try {
    const payload = { ...req.payload, ...req.params };
    const invitedUsers = await service.inviteUsers(payload, message);

    return reply({
      success: true,
      data: responseUtil.serialize(invitedUsers),
    });
  } catch (err) {
    console.log('Error in bulk-invite user: ', err);
    return reply(err);
  }
};
