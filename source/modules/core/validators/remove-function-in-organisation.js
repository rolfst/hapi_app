const Joi = require('joi');

module.exports = {
  params: {
    organisationId: Joi.number().required(),
    organisationFunctionId: Joi.number().required(),
  },
};
