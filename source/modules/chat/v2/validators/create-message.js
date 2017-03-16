const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    text: Joi.string().allow(null).allow(''),
    files: Joi.any(),
  }).or('text', 'files'),
};
