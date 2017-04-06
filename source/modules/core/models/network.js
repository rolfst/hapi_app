const R = require('ramda');
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
  integrations: R.pluck('name', dao.Integrations),
  superAdmin: dao.SuperAdmin ? R.pick(['id', 'fullName', 'email', 'function', 'profileImg'], createUserModel(dao.SuperAdmin)) : null,
  enabledComponents: R.pipe(R.split(','), R.map(replaceChars), R.flatten)(dao.enabledComponents),
  welcomeMailTemplate: dao.welcomeMailTemplate || null,
  createdAt: dateUtils.toISOString(dao.created_at),
});
