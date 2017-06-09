const Joi = require('joi');
const { TRIGGER_SCHEME } = require('../definitions');

module.exports = {
  payload: TRIGGER_SCHEME,
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
  }),
};
