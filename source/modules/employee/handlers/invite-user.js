import inviteUser from 'modules/employee/controllers/invite-user';

export default async (req, reply) => {
  try {
    await inviteUser(req.pre.network, req.payload);

    reply({ message: 'User is invited.' });
  } catch (err) {
    console.log('Error when creating user for network', err);
    reply(err);
  }
};
