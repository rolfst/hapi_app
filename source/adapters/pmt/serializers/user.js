export default (externalUser) => ({
  externalId: externalUser.id,
  username: externalUser.email,
  email: externalUser.email,
  firstName: externalUser.first_name,
  lastName: externalUser.last_name,
  dateOfBirth: externalUser.date_of_birth,
  phoneNum: externalUser.cell_phone_number,
  isAdmin: externalUser.rolename === 'admin',
  isActive: externalUser.active,
  teamId: externalUser.department,
});
