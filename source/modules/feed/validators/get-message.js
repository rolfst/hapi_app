const Joi = require('joi');

export default {
  query: {
    include: Joi.string(),
  },
};
