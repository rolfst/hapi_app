export default (req, reply) => {
  const loggedUser = req.auth.credentials;

  return reply({ data: loggedUser.toJSON() });
};
