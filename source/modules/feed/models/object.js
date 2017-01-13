import * as dateUtils from '../../../shared/utils/date';

export default (dataModel) => ({
  id: dataModel.id.toString(),
  userId: dataModel.userId.toString(),
  objectType: dataModel.objectType,
  sourceId: dataModel.sourceId.toString(),
  parentType: dataModel.parentType,
  parentId: dataModel.parentId.toString(),
  createdAt: dateUtils.toISOString(dataModel.created_at),
});
