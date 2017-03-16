const Joi = require('joi');

module.exports = {
  payload: {
    type: Joi.string().valid('private', 'group').required(),
    users: Joi.array().required(),
  },
};
