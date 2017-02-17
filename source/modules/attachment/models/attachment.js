import * as dateUtils from '../../../shared/utils/date';
import * as Storage from '../../../shared/services/storage';

export default (dao) => ({
  type: 'attachment',
  id: dao.id.toString(),
  objectId: dao.objectId ? dao.objectId.toString() : null,
  path: `https://assets.flex-appeal.nl/${Storage.getLocation()}/attachments/${dao.path}`,
  createdAt: dateUtils.toISOString(dao.created_at),
});
