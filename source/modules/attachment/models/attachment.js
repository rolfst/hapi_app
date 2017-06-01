const dateUtils = require('../../../shared/utils/date');
const Storage = require('../../../shared/services/storage');

module.exports = (dao) => ({
  type: 'attachment',
  id: dao.id.toString(),
  messageId: dao.messageId ? dao.messageId.toString() : null,
  path: `https://assets.flex-appeal.nl/${Storage.getEnvironmentLocation()}/attachments/${dao.path}`,
  createdAt: dateUtils.toISOString(dao.created_at),
});
