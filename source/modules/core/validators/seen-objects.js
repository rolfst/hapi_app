const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    ids: Joi.array().required().min(1).items(Joi.number()),
  }),
};
