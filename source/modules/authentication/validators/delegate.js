const Joi = require('joi');

export default {
  query: {
    refresh_token: Joi.string().required(),
  },
};
