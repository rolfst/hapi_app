import { map, toString } from 'lodash';
import moment from 'moment';

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
  const serializedUser = {
    externalId: properUser.id,
    username: properUser.username || properUser.email,
    email: properUser.email,
    integrationAuth: null,
    function: null,
    firstName: properUser.first_name,
    lastName: properUser.last_name,
    dateOfBirth: properUser.date_of_birth,
    phoneNum: formatPhoneNumber(properUser.cell_phone_number)
      || formatPhoneNumber(properUser.home_phone_number),
    roleType: 'EMPLOYEE',
    isActive: properUser.active,
    deletedAt: properUser.active ? null : moment().toISOString(),
    teamIds: properUser.scope ? map(map(properUser.scope, 'department'), toString) : [],
  };

  return serializedUser;
};
