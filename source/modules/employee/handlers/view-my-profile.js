export default (req, reply) => {
  const loggedUser = req.auth.credentials
    .setFunctionNameForNetwork(req.params.networkId);

  reply({ data: loggedUser.toJSON() });
};
