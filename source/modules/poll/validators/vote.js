const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    option_ids: Joi.array().required(),
  }),
};
