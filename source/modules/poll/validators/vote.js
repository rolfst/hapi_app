const Joi = require('joi');

export default {
  payload: Joi.object().keys({
    option_ids: Joi.array().required(),
  }),
};
