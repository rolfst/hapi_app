export default (chain) => ({
  externalId: `https://${chain.base_url}`,
  name: chain.name,
});
