const Joi = require('joi');
const { EActionTypes } = require('../h');

module.exports = {
  payload: Joi.object().keys({
    type: Joi.string().required().valid.apply(null, Object.values(EActionTypes)),
    meta: Joi.string().required(),
}),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
    actionId: Joi.number().required(),
  }),
};
