const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    userIds: Joi.array().required(),
  }).rename('user_ids', 'userIds'),
};
