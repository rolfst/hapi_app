const Joi = require('joi');

module.exports = {
  params: {
    organisationId: Joi.number().required(),
    userId: Joi.number().required(),
  },
};
