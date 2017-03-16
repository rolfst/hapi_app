const Joi = require('joi');

export default {
  payload: {
    username: Joi.string().required(),
    password: Joi.string().required(),
  },
};
