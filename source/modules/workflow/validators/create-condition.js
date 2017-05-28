const Joi = require('joi');
const { EConditionOperators } = require('../definitions');

module.exports = {
  payload: Joi.object().keys({
    field: Joi.string().required(),
    operator: Joi.string().required().valid(Object.values(EConditionOperators)),
    value: Joi.string().required(),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
  }),
};
