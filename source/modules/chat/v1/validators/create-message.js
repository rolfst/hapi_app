const Joi = require('joi');

module.exports = {
  payload: {
    text: Joi.string().required(),
  },
};
