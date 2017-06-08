const Joi = require('joi');

module.exports = {
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
  }),
  query: Joi.object().keys({
    limit: Joi.number().min(1).default(20),
    offset: Joi.number().min(0).default(0),
    q: Joi.string().min(3),
    select: Joi.string().valid('active', 'inactive', 'admin', 'notactivated'),
  }).nand('q', 'select'),
};
