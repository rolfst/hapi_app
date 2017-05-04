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
    phoneNum: Joi.string().regex(/(^(((0)[1-9]{2}[0-9][-]?[1-9][0-9]{5})|((\\+31|0|0031)[1-9][0-9][-]?[1-9][0-9]{6}))$)|(^(((\\+31|0|0031)6){1}[1-9]{1}[0-9]{7})$)/i),
  })
    .rename('first_name', 'firstName')
    .rename('last_name', 'lastName')
    .rename('zip_code', 'zipCode')
    .rename('date_of_birth', 'dateOfBirth')
    .rename('phone_num', 'phoneNum'),
};
