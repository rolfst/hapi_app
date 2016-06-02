export default (req, reply) => {
  const loggedUser = req.auth.credentials
    .setFunctionName(req.params.networkId);

  reply({ data: loggedUser.toJSON() });
};
