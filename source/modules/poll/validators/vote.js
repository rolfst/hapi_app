const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    optionIds: Joi.array().required(),
  }).rename('options_ids', 'optionIds'),
};
