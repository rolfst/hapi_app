const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    conditionId: Joi.number().required(),
  }),
};
