const dateUtils = require('../../../shared/utils/date');

module.exports = (dao) => ({
  organisationId: dao.organisationId ? dao.organisationId.toString() : null,
  userId: dao.userId,
  functionId: dao.functionId,
  roleType: dao.roleType,
  invitedAt: dao.invitedAt ? dateUtils.toISOString(dao.invitedAt) : null,
  deletedAt: dao.deletedAt ? dateUtils.toISOString(dao.deletedAt) : null,
  externalId: dao.externalId,
  lastActive: dao.lastActive ? dateUtils.toISOString(dao.lastActive) : null,
  createdAt: dao.created_at ? dateUtils.toISOString(dao.created_at) : null,
  updatedAt: dao.updated_at ? dateUtils.toISOString(dao.updated_at) : null,
});
