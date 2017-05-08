const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    networks: Joi.array().required().min(1).items(Joi.number()),
  }),
  params: {
    organisationId: Joi.number().required(),
    userId: Joi.number().required(),
  },
};
