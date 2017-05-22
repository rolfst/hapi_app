const Joi = require('joi');
const { ETriggerTypes } = require('../definitions');

module.exports = {
  payload: Joi.object().keys({
    type: Joi.string().required().valid(Object.values(ETriggerTypes)),
    value: Joi.string().required(),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    triggerId: Joi.number().required(),
  }),
};
