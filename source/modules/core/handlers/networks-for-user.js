export default async (req, reply) => {
  const data = req.auth.credentials.Networks
    .map(network => network.toJSON());

  return reply({ data });
};
