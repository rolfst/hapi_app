const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    triggerId: Joi.number().required(),
  }),
};
