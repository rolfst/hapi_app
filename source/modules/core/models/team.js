export default (dao) => ({
  id: dao.id.toString(),
  networkId: dao.networkId,
  externalId: dao.externalId,
  name: dao.name,
  description: dao.description,
});
