const Joi = require('joi');
const { EConditionOperators } = require('../h');

module.exports = {
  payload: Joi.object().keys({
    field: Joi.string().required(),
    operator: Joi.string().required().valid.apply(null, Object.values(EConditionOperators)),
    value: Joi.string().required(),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
  }),
};
