const Joi = require('joi');
const { DEFAULT_MESSAGE_LIMIT } = require('../definitions');

module.exports = {
  params: {
    organisationId: Joi.number().required(),
    limit: Joi.number().default(DEFAULT_MESSAGE_LIMIT),
    offset: Joi.number(),
  },
};
