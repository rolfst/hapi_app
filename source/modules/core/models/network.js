const { map, flatten } = require('lodash');
const dateUtils = require('../../../shared/utils/date');
const createUserModel = require('./user');

const replaceChars = (string) => string.match(/([A-Z])\w+/g);

module.exports = (dao) => ({
  type: 'network',
  id: dao.id.toString(),
  externalId: dao.externalId ? dao.externalId.toString() : null,
  name: dao.name,
  importedAt: dao.Integrations[0] ? dao.Integrations[0].NetworkIntegration.importedAt : null,
  hasIntegration: dao.Integrations.length > 0,
  integrations: map(dao.Integrations, 'name'),
  superAdmin: dao.SuperAdmin ? createUserModel(dao.SuperAdmin) : null,
  enabledComponents: flatten(dao.enabledComponents.split(',').map(replaceChars)),
  welcomeMailTemplate: dao.welcomeMailTemplate || null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
