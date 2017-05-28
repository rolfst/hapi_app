const Joi = require('joi');
const { EActionTypes } = require('../definitions');

module.exports = {
  payload: Joi.object().keys({
    type: Joi.string().required().valid(Object.values(EActionTypes)),
    meta: Joi.alternatives(Joi.string(), Joi.object()).required(),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    workflowId: Joi.number().required(),
  }),
};
