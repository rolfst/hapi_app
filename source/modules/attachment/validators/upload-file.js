const Joi = require('joi');

module.exports = {
  payload: {
    file: Joi.required().rename('fileStream'),
  },
};
