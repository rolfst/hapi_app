const Joi = require('joi');

export default {
  payload: {
    external_email: Joi.string().required(),
  },
};
