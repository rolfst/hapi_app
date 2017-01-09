export default (dataModel) => ({
  id: dataModel.id.toString(),
  userId: dataModel.userId.toString(),
  objectType: dataModel.objectType,
  sourceId: dataModel.sourceId.toString(),
  parentType: dataModel.parentType,
  parentId: dataModel.parentId.toString(),
  createdAt: dataModel.createdAt,
  updatedAt: dataModel.updatedAt,
});
