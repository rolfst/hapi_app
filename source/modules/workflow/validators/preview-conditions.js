const Joi = require('joi');
const { CONDITIONS_SCHEME } = require('../definitions');

module.exports = {
  payload: Joi.object().keys({
    conditions: CONDITIONS_SCHEME.min(1),
  }),
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
  }),
};
