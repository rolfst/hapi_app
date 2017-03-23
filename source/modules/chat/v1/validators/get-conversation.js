const Joi = require('joi');

module.exports = {
  query: {
    include: Joi.any().valid(['messages']),
  },
};
