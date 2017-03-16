const R = require('ramda');
const moment = require('moment');

function formatPhoneNumber(number) {
  if (!number) return null;
  return number.toString().replace(/\D/g, '');
}

export default (externalUser) => {
  const defaultProps = {
    id: null,
    department: null,
    username: null,
    email: null,
    last_name: null,
    first_name: null,
    date_of_birth: null,
    rolename: null,
    scope: [],
    active: true,
    cell_phone_number: null,
    home_phone_number: null,
  };

  const properUser = { ...defaultProps, ...externalUser };
  let teamIds = [];

  if (properUser.scope && properUser.scope.length > 0) {
    teamIds = R.pipe(
      R.pluck('department'),
      R.sort((a, b) => a - b)
    )(properUser.scope);
  } else if (properUser.department) {
    teamIds = [properUser.department];
  }

  const serializedUser = {
    externalId: properUser.id,
    username: properUser.email ? properUser.email.toLowerCase() : null,
    email: properUser.email ? properUser.email.toLowerCase() : null,
    integrationAuth: null,
    function: null,
    firstName: properUser.first_name,
    lastName: properUser.last_name,
    dateOfBirth: moment(properUser.date_of_birth).isValid('YYYY-MM-DD') ?
      properUser.date_of_birth : null,
    phoneNum: formatPhoneNumber(properUser.cell_phone_number)
      || formatPhoneNumber(properUser.home_phone_number),
    roleType: 'EMPLOYEE',
    isActive: properUser.active,
    deletedAt: properUser.active ? null : moment().toISOString(),
    teamIds,
  };

  return serializedUser;
};
