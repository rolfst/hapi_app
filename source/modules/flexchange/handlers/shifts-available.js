/* export default (req, reply) => {
  // TODO: add authorization if user can access the network
  // TODO: add check to check if network has integration enabled or not
  findNetworkById(req.params.networkId).then(network => {
    const adapter = createAdapter(network.Integrations[0].id);

    return adapter
      .usersAvailableForShift(network.externalId, req.params.shiftId)
      .then(users => reply({ data: users }));
  });
}; */
