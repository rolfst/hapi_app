import * as dateUtils from '../../../shared/utils/date';

export default (dao) => ({
  id: dao.id.toString(),
  username: dao.username,
  password: dao.password,
  lastLogin: dao.lastLogin ? dateUtils.toISOString(dao.lastLogin) : null,
});
