const getIntegrationTokensForUser = (user) => {
  const result = user.Networks
    .filter(network => network.NetworkUser.userToken !== null)
    .map(network => ({
      name: network.Integrations[0].name,
      token: network.NetworkUser.userToken,
      externalId: network.NetworkUser.externalId,
    }));

  return result;
};

export default getIntegrationTokensForUser;
