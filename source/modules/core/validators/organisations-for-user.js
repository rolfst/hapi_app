const Joi = require('joi');

module.exports = {
  query: {
    include: Joi.string().valid('networks'),
  },
};
