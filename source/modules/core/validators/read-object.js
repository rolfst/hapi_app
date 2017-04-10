const Joi = require('joi');

module.exports = {
  params: {
    objectId: Joi.number().required()
  }
};
