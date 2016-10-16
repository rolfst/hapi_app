import { pick } from 'lodash';
import * as dateUtils from '../../../shared/utils/date';

const whitelistAttrs = [
  'username',
  'firstName',
  'lastName',
  'fullName',
  'phoneNum',
  'email',
];

const environment = process.env.NODE_ENV === 'production' ? 'production' : 'staging';

export default (dao) => ({
  type: 'user',
  id: dao.id.toString(),
  ...pick(dao, whitelistAttrs),
  externalId: dao.externalId || null,
  integrationAuth: dao.integrationAuth || null,
  function: dao.function || null,
  roleType: dao.role || null,
  profileImg: `https://s3.eu-central-1.amazonaws.com/flex-appeal/${environment}/profiles/${dao.profileImg}`,
  dateOfBirth: dao.dateOfBirth ? dateUtils.toISOString(dao.dateOfBirth) : null,
  createdAt: dateUtils.toISOString(dao.created_at),
  lastLogin: dao.lastLogin ? dateUtils.toISOString(dao.lastLogin) : null,
});
