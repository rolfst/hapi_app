const Joi = require('joi');
const { ACTION_SCHEME } = require('../definitions');

module.exports = {
  payload: ACTION_SCHEME,
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    actionId: Joi.number().required(),
  }),
};
