const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    user_ids: Joi.array().required(),
  }).rename('user_ids', 'userIds'),
};
