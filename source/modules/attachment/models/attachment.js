import * as dateUtils from '../../../shared/utils/date';

export default (dao) => ({
  type: 'attachment',
  id: dao.id.toString(),
  objectId: dao.objectId ? dao.objectId.toString() : null,
  path: dao.path,
  createdAt: dateUtils.toISOString(dao.created_at),
});
