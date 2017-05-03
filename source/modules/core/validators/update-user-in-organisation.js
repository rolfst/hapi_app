const Joi = require('joi');

module.exports = {
  payload: Joi.object()
    .keys({
      functionId: Joi.number().label('function_id'),
      roleType: Joi.string().label('role_type'),
      firstName: Joi.string(),
      lastName: Joi.string(),
      email: Joi.string().email(),
      password: Joi.string(),
      dateOfBirth: Joi.date().format('YYYY-MM-DD'),
      phoneNum: Joi.string().regex(/(^(((0)[1-9]{2}[0-9][-]?[1-9][0-9]{5})|((\\+31|0|0031)[1-9][0-9][-]?[1-9][0-9]{6}))$)|(^(((\\+31|0|0031)6){1}[1-9]{1}[0-9]{7})$)/i),
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
