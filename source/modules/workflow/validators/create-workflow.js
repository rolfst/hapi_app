const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    organisationId: Joi.number().required(),
    name: Joi.string().required(),
    startDate: Joi.Joi.date().format('YYYY-MM-DD'),
    expirationDate: Joi.Joi.date().format('YYYY-MM-DD'),
  })
    .rename('organisation_id', 'organisationId')
    .rename('start_date', 'startDate')
    .rename('expiration_date', 'expirationDate'),

};
