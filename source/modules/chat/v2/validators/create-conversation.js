const Joi = require('joi');

module.exports = {
  payload: {
    type: Joi.string().valid('private', 'group').required(),
    participantIds: Joi.array().unique().required(),
  },
};
