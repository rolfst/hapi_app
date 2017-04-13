const Joi = require('joi');

module.exports = {
  payload: {
    functionId: Joi.number().required(),
    organisationId: Joi.number().required(),
  },
  params: {
    userId: Joi.number().required(),
    networkId: Joi.number().required(),
  },
};
