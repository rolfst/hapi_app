const Joi = require('joi');

export default {
  payload: {
    user_ids: Joi.array().required(),
  },
};
