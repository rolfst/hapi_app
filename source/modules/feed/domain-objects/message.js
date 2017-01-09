export default (dataModel) => ({
  id: dataModel.id.toString(),
  userId: dataModel.userId.toString(),
  text: dataModel.text,
  createdAt: dataModel.createdAt,
  updatedAt: dataModel.updatedAt,
});
