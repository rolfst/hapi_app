const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    file: Joi.required(),
  }).rename('file', 'fileStream'),
};
