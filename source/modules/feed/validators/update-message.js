const Joi = require('joi');

module.exports = {
  payload: {
    text: Joi.string().required(),
  },
  params: {
    messageId: Joi.string().required(),
  },
};
