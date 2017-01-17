import { map, pick, toString } from 'lodash';
import * as dateUtils from '../../../shared/utils/date';

const whitelistAttrs = [
  'firstName',
  'lastName',
  'fullName',
  'phoneNum',
];

let environment = 'production';
if (process.env.API_ENV === 'acceptance') environment = 'acc';
if (process.env.API_ENV === 'development') environment = 'staging';

export default (dao) => ({
  type: 'user',
  id: dao.id.toString(),
  ...pick(dao, whitelistAttrs),
  username: dao.username.toLowerCase(),
  email: dao.email.toLowerCase(),
  externalId: dao.externalId ? dao.externalId.toString() : null,
  integrationAuth: dao.integrationAuth || null,
  function: dao.roleType === 'ADMIN' ? 'Beheerder' : 'Medewerker',
  roleType: dao.roleType || null,
  teamIds: dao.Teams ? map(map(dao.Teams, 'id'), toString) : [],
  profileImg: `https://assets.flex-appeal.nl/${environment}/profiles/${dao.profileImg}`,
  dateOfBirth: dao.dateOfBirth ? dateUtils.toISOString(dao.dateOfBirth) : null,
  createdAt: dateUtils.toISOString(dao.created_at),
  lastLogin: dao.lastLogin ? dateUtils.toISOString(dao.lastLogin) : null,
  deletedAt: dao.deletedAt || null,
});
