const Joi = require('joi');
const { PHONENUM_REGEX } = require('../definitions');

module.exports = {
  payload: Joi.object()
    .keys({
      roleType: Joi.string().label('role_type'),
      firstName: Joi.string(),
      lastName: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string(),
      dateOfBirth: Joi.date().format('YYYY-MM-DD').allow(null),
      phoneNum: Joi.string().regex(PHONENUM_REGEX).allow(null),
    })
    .rename('role_type', 'roleType')
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('date_of_birth', 'dateOfBirth')
    .rename('phone_num', 'phoneNum')
    .or(
      'roleType',
      'firstName',
      'lastName',
      'email',
      'password',
      'dateOfBirth',
      'phoneNum'
    ),
  params: {
    networkId: Joi.number().required(),
    userId: Joi.number().required(),
  },
};
