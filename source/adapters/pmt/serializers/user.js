import { includes } from 'lodash';

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
    active: true,
    cell_phone_number: null,
    home_phone_number: null,
  };

  const properUser = { ...defaultProps, ...externalUser };
  const serializedUser = {
    externalId: properUser.id,
    username: properUser.username
      ? properUser.email : properUser.username,
    email: properUser.email,
    firstName: properUser.first_name,
    lastName: properUser.last_name,
    dateOfBirth: properUser.date_of_birth,
    phoneNum: properUser.cell_phone_number
      ? properUser.cell_phone_number : properUser.home_phone_number,
    isAdmin: includes(['Bedrijfsleiding', 'Afdelingsmanager', 'admin', 'Organisation', 'Assistent Manager'], properUser.rolename),
    isActive: properUser.active,
    teamId: properUser.department,
  };

  return serializedUser;
};
