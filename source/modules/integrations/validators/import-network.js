const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    external_email: Joi.string().required(),
  }).rename('external_email', 'ownerEmail'),
};
