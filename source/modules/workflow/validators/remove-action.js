const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    actionId: Joi.number().required(),
  }),
};
