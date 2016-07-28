export default (user, networkId) => {
  const networks = user.Networks.filter(network => network.id === networkId);

  if (networks.length === 0) throw new Error('User doesn\'t belong to any network.');

  return networks[0].NetworkUser.deletedAt !== null;
};
