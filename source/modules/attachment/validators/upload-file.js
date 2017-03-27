const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    file: Joi.any(),
  }).rename('file', 'fileStream'),
};
