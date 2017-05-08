const Joi = require('joi');

module.exports = {
  query: {
    include: Joi.string().default('').valid('users'),
  },
};
