const Joi = require('joi');

module.exports = {
  params: {
    organisationId: Joi.number().required(),
    functionId: Joi.number().required(),
  },
};
