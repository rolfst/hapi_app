const Joi = require('joi');
const { ETriggerTypes, EConditionOperators, EActionTypes } = require('../definitions');

const triggerScheme = Joi.object().keys({
  type: Joi.string().required().valid(Object.values(ETriggerTypes)),
  value: Joi.string().required(),
});
const conditionScheme = Joi.object().keys({
  field: Joi.string().required(),
  operator: Joi.string().required().valid(Object.values(EConditionOperators)),
  value: Joi.string().required(),
});
const actionScheme = Joi.object().keys({
  type: Joi.string().required().valid(Object.values(EActionTypes)),
  meta: Joi.alternatives(Joi.string(), Joi.object()).required(),
});


module.exports = {
  payload: Joi.object().keys({
    name: Joi.string().required(),
    meta: Joi.string(),
    startDate: Joi.date().format('YYYY-MM-DD').label('start_date'),
    expirationDate: Joi.date().format('YYYY-MM-DD').label('expiration_date'),
    triggers: Joi.array().items(triggerScheme),
    actions: Joi.array().items(actionScheme).min(1),
    conditions: Joi.array().items(conditionScheme).min(1),
  })
    .rename('start_date', 'startDate')
    .rename('expiration_date', 'expirationDate'),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
  }),
};
