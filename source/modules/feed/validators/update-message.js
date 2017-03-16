const Joi = require('joi');

export default {
  payload: {
    text: Joi.string().required(),
  },
  params: {
    messageId: Joi.string().required(),
  },
};
