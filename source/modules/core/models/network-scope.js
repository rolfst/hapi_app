module.exports = (dataModel) => ({
  id: dataModel.id.toString(),
  name: dataModel.name,
  organisationId: dataModel.organisationId,
});
