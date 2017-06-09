const Joi = require('joi');
const { ESEARCH_SELECTORS } = require('../definitions');

module.exports = {
  params: Joi.object().keys({
    organisationId: Joi.number().required(),
  }),
  query: Joi.object().keys({
    limit: Joi.number().min(1).default(20),
    offset: Joi.number().min(0).default(0),
    q: Joi.string().min(3),
    select: Joi.string().valid(
      ESEARCH_SELECTORS.ACTIVE,
      ESEARCH_SELECTORS.INACTIVE,
      ESEARCH_SELECTORS.ADMIN,
      ESEARCH_SELECTORS.NOT_ACTIVATED
    ),
  }).nand('q', 'select'),
};
