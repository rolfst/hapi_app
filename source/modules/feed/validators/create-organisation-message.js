const Joi = require('joi');
const { MESSAGE_SCHEME } = require('../../feed/definitions');

module.exports = {
  payload: MESSAGE_SCHEME,
  params: {
    organisationId: Joi.number().required(),
  },
};
