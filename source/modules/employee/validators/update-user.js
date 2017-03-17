const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    first_name: Joi.string(),
    last_name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string(),
    address: Joi.string(),
    zip_code: Joi.string(),
    date_of_birth: Joi.date().format('YYYY-MM-DD'),
    phone_num: Joi.string(),
  })
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('zip_code', 'zipCode')
    .rename('date_of_birth', 'dateOfBirth')
    .rename('phone_num', 'phoneNum'),
};
