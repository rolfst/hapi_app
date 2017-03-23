const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    name: Joi.string(),
    description: Joi.string(),
    userIds: Joi.array(),
    isChannel: Joi.boolean(),
  }).rename('is_channel', 'isChannel')
    .rename('user_ids', 'userIds'),
};
