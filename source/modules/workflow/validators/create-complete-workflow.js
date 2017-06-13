const Joi = require('joi');
const { TRIGGERS_SCHEME, CONDITIONS_SCHEME, ACTIONS_SCHEME } = require('../definitions');

module.exports = {
  payload: Joi.object().keys({
    name: Joi.string(),
    meta: Joi.string(),
    startDate: Joi.date().format('YYYY-MM-DD').label('start_date'),
    expirationDate: Joi.date().format('YYYY-MM-DD').label('expiration_date'),
    triggers: TRIGGERS_SCHEME.default([]),
    conditions: CONDITIONS_SCHEME.default([]),
    actions: ACTIONS_SCHEME.min(1),
  })
    .rename('start_date', 'startDate')
    .rename('expiration_date', 'expirationDate'),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
  }),
};
