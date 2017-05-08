const R = require('ramda');
const dateUtils = require('../../../shared/utils/date');

const whitelistAttrs = [
  'firstName',
  'lastName',
  'fullName',
  'phoneNum',
];

let environment = 'production';
if (process.env.API_ENV === 'acceptance') environment = 'acc';
if (process.env.API_ENV === 'development') environment = 'staging';

module.exports = (dao) => R.merge(
  R.pick(whitelistAttrs, dao),
  {
    type: 'user',
    id: dao.id.toString(),
    username: dao.username.toLowerCase(),
    email: dao.email.toLowerCase(),
    externalId: dao.externalId ? dao.externalId.toString() : null,
    integrationAuth: dao.userToken ? !!dao.userToken : dao.integrationAuth || null,
    function: dao.roleType === 'ADMIN' ? 'Beheerder' : 'Medewerker',
    roleType: dao.roleType || null,
    teamIds: dao.Teams ? R.map(R.pipe(R.prop('id'), R.toString), dao.Teams) : [],
    profileImg: `https://assets.flex-appeal.nl/${environment}/profiles/${dao.profileImg}`,
    dateOfBirth: dao.dateOfBirth ? dateUtils.toISOString(dao.dateOfBirth) : null,
    createdAt: dateUtils.toISOString(dao.created_at),
    lastLogin: dao.lastLogin ? dateUtils.toISOString(dao.lastLogin) : null,
    // TODO: replace with actual value
    lastActive: dao.lastLogin ? dateUtils.toISOString(dao.lastLogin) : null,
    invitedAt: dao.invitedAt ? dateUtils.toISOString(dao.invitedAt) : null,
    deletedAt: dao.deletedAt || null,
  }
);
