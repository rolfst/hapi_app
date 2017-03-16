const Joi = require('joi');

module.exports = {
  payload: {
    username: Joi.string().required(),
    password: Joi.string().required(),
  },
};
