const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
    limit: Joi.number().default(20),
    offset: Joi.number().default(0),
  }),
};
