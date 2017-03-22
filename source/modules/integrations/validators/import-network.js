const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    ownerEmail: Joi.string().required(),
  }).rename('external_email', 'ownerEmail'),
};
