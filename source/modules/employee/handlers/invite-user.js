import camelCaseKeys from 'common/utils/camel-case-keys';
import * as userRepo from 'common/repositories/user';
import addNetworkScope from 'common/utils/add-network-scope';
import inviteUser from 'modules/employee/controllers/invite-user';

export default async (req, reply) => {
  try {
    const payload = camelCaseKeys(req.payload);
    const network = req.pre.network;
    await inviteUser(network, payload);
    const invitedUser = await userRepo.findUserByEmail(req.payload.email);

    return reply({ success: true, data: addNetworkScope(invitedUser, network.id).toJSON() });
  } catch (err) {
    return reply(err);
  }
};
