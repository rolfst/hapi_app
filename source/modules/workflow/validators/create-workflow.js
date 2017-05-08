const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    name: Joi.string().required(),
    meta: Joi.string(),
    startDate: Joi.date().format('YYYY-MM-DD').label('start_date'),
    expirationDate: Joi.date().format('YYYY-MM-DD').label('expiration_date'),
  })
    .rename('start_date', 'startDate')
    .rename('expiration_date', 'expirationDate'),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
  }),
};
