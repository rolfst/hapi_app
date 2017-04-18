const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    ids: Joi.array().min(1).items(Joi.number()),
  }),
};
