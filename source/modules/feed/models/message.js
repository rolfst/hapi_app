import * as dateUtils from '../../../shared/utils/date';

export default (dataModel) => ({
  type: 'message',
  id: dataModel.id.toString(),
  objectId: dataModel.objectId ? dataModel.objectId.toString() : null,
  text: dataModel.text,
  createdAt: dateUtils.toISOString(dataModel.created_at),
});
