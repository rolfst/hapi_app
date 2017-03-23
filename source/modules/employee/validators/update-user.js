const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    firstName: Joi.string(),
    lastName: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string(),
    address: Joi.string(),
    zipCode: Joi.string(),
    dateOfBirth: Joi.date().format('YYYY-MM-DD'),
    phoneNum: Joi.string(),
  })
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('zip_code', 'zipCode')
    .rename('date_of_birth', 'dateOfBirth')
    .rename('phone_num', 'phoneNum'),
};
