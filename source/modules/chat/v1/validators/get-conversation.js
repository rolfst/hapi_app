const Joi = require('joi');

export default {
  query: {
    include: Joi.any().valid(['messages']),
  },
};
