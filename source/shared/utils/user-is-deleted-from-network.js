export default (user, networkId) => {
  const networks = user.Networks.filter(network => network.id === networkId);

  if (networks.length === 0) return false;

  return networks[0].NetworkUser.deletedAt !== null;
};
