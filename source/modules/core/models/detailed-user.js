const dateUtils = require('../../../shared/utils/date');

let environment = 'production';
if (process.env.API_ENV === 'acceptance') environment = 'acc';
if (process.env.API_ENV === 'development') environment = 'staging';

module.exports = (dataModel) => ({
  id: dataModel.id,
  username: dataModel.username,
  firstName: dataModel.firstName,
  lastName: dataModel.lastName,
  phoneNum: dataModel.phoneNum,
  email: dataModel.email.toLowerCase(),
  addres: dataModel.address,
  zipCode: dataModel.zipCode,
  profileImg: `https://assets.flex-appeal.nl/${environment}/profiles/${dataModel.profileImg}`,
  dateOfBirth: dataModel.dateOfBirth
    ? dateUtils.toISOString(dataModel.dateOfBirth) : null,
  lastLogin: dataModel.lastLogin
    ? dateUtils.toISOString(dataModel.lastLogin) : null,
  createdAt: dateUtils.toISOString(dataModel.created_at),
  updatedAt: dateUtils.toISOString(dataModel.updated_at),
  scopes: {
    organisations: null,
    networks: null,
  },
});
