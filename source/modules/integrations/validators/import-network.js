const Joi = require('joi');

module.exports = {
  payload: {
    external_email: Joi.string().required().rename('ownerEmail'),
  },
};
