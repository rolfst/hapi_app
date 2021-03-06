const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    name: Joi.string().required(),
    description: Joi.string(),
    userIds: Joi.array().default([]),
    isChannel: Joi.boolean().default(true),
  }).rename('is_channel', 'isChannel')
    .rename('user_ids', 'userIds'),
};
