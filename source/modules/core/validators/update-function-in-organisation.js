const Joi = require('joi');

module.exports = {
  payload: {
    name: Joi.string().required(),
  },
  params: {
    organisationId: Joi.number().required(),
    functionId: Joi.number().required(),
  },
};
