const Joi = require('joi');

export default {
  payload: Joi.object().keys({
    text: Joi.string().allow(null).allow(''),
    files: Joi.any(),
  }).or('text', 'files'),
};
