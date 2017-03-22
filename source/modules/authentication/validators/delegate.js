const Joi = require('joi');

module.exports = {
  query: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }).rename('refresh_token', 'refreshToken'),
};
