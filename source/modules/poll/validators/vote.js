const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    optionIds: Joi.array().min(1).required(),
  }).rename('option_ids', 'optionIds'),
};
