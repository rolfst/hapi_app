const Joi = require('joi');

module.exports = {
  payload: {
    user_ids: Joi.array().required().rename('userIds'),
  },
};
