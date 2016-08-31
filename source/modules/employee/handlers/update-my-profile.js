export default async (req, reply) => {
  try {
    const network = req.pre.network;
    const updatedUser = await req.auth.credentials.update(req.payload);

    updatedUser.set('scope', network.NetworkUser.roleType);

    return reply({ success: true, data: updatedUser.toJSON() });
  } catch (err) {
    return reply(err);
  }
};
