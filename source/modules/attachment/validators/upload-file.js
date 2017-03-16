const Joi = require('joi');

export default {
  payload: {
    file: Joi.required(),
  },
};
