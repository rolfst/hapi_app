const Joi = require('joi');

module.exports = {
  query: {
    refresh_token: Joi.string().required(),
  },
};
