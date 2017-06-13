const Joi = require('joi');
const { CONDITION_SCHEME } = require('../definitions');

module.exports = {
  payload: CONDITION_SCHEME,
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    conditionId: Joi.number().required(),
  }),
};
