import { map } from 'lodash';

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
    firstName: properUser.first_name,
    lastName: properUser.last_name,
    dateOfBirth: properUser.date_of_birth,
    phoneNum: properUser.cell_phone_number || properUser.home_phone_number,
    isAdmin: false,
    isActive: properUser.active,
    teamIds: map(properUser.scope, 'department'),
  };

  return serializedUser;
};
