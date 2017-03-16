const dateUtils = require('../../../../shared/utils/date');

export default (dataModel) => ({
  type: 'private_message',
  id: dataModel.id.toString(),
  objectId: dataModel.objectId ? dataModel.objectId.toString() : null,
  text: dataModel.text,
  createdAt: dateUtils.toISOString(dataModel.created_at),
});
