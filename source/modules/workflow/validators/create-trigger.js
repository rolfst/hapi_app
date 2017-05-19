const Joi = require('joi');
const { ETriggerTypes } = require('../h');

module.exports = {
  payload: Joi.object().keys({
    type: Joi.string().required().valid(Object.values(ETriggerTypes)),
    value: Joi.string().required(),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
  }),
};