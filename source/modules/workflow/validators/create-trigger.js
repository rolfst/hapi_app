const Joi = require('joi');
const { ETriggerTypes } = require('../h');

module.exports = {
  payload: Joi.object().keys({
    type: Joi.string().required(),
    value: Joi.string().required().valid.apply(null, Object.values(ETriggerTypes)),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
  }),
};
