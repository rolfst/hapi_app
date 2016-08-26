import inviteUser from 'modules/employee/controllers/invite-user';

export default async (req, reply) => {
  try {
    const invitedUser = await inviteUser(req.pre.network, req.payload);

    return reply({ success: true, data: invitedUser.toJSON() });
  } catch (err) {
    console.log('Error when creating user for network', err);

    return reply(err);
  }
};
