const dateUtils = require('../../../shared/utils/date');

module.exports = (dao) => ({
  id: dao.id.toString(),
  username: dao.username,
  password: dao.password,
  lastLogin: dao.lastLogin ? dateUtils.toISOString(dao.lastLogin) : null,
});
