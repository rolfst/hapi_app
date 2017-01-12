export default (objectModel) => ({
  objectId: objectModel.id,
  objectType: objectModel.objectType,
  parentType: objectModel.parentType,
  parentId: objectModel.parentId,
  userId: objectModel.userId,
  source: objectModel.source || {},
  createdAt: objectModel.createdAt,
});
