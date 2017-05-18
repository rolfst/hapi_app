const Joi = require('joi');
const { PHONENUM_REGEX } = require('../definitions');

module.exports = {
  payload: Joi.object()
    .keys({
      functionId: Joi.number().label('function_id'),
      roleType: Joi.string().label('role_type'),
      firstName: Joi.string(),
      lastName: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string(),
      dateOfBirth: Joi.date().format('YYYY-MM-DD').allow(null),
      phoneNum: Joi.string().regex(PHONENUM_REGEX).allow(null),
    })
    .rename('function_id', 'functionId')
    .rename('role_type', 'roleType')
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('date_of_birth', 'dateOfBirth')
    .rename('phone_num', 'phoneNum')
    .or(
      'functionId',
      'roleType',
      'firstName',
      'lastName',
      'email',
      'password',
      'dateOfBirth',
      'phoneNum'
    ),
  params: {
    organisationId: Joi.number().required(),
    userId: Joi.number().required(),
  },
};
