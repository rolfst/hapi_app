export default (user, networkId = false) => {
  return user.Networks
    .filter(network => network.NetworkUser.deletedAt === null)
    .filter(network => networkId ? network.id === networkId : true)
    .length > 0;
};
