export default (dao) => ({
  id: dao.id.toString(),
  networkId: dao.networkId.toString(),
  externalId: dao.externalId ? dao.externalId.toString() : null,
  name: dao.name,
  description: dao.description || null,
});
