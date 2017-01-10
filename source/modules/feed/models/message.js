import * as dateUtils from '../../../shared/utils/date';

export default (dataModel) => ({
  id: dataModel.id.toString(),
  userId: dataModel.userId.toString(),
  text: dataModel.text,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
});
