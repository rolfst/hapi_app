const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    fileStream: Joi.any().label('file'),
  }).rename('file', 'fileStream'),
};
