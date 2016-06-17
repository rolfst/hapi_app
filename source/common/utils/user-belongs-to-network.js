export default (user) => {
  return user.Networks
    .filter(network => network.NetworkUser.deletedAt === null)
    .length > 0;
};
