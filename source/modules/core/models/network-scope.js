const dateUtils = require('../../../shared/utils/date');

module.exports = (dataModel) => ({
  id: dataModel.id.toString(),
  name: dataModel.name,
  organisationId: dataModel.organisationId ? dataModel.organisationId.toString() : null,
  invitedAt: dateUtils.toISOString(dataModel.invitedAt),
  roleType: dataModel.roleType,
});
