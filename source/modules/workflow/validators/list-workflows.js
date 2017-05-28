const Joi = require('joi');

module.exports = {
  query: {
    limit: Joi.number().default(20),
    offset: Joi.number().default(0),
  },
  params: {
    organisationId: Joi.number().required(),
  },
};
