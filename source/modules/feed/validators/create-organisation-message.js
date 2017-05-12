const Joi = require('joi');
const { MESSAGE_SCHEME } = require('../../feed/definitions');
const { CONDITIONS_SCHEME } = require('../../workflow/definitions');

module.exports = {
  payload: MESSAGE_SCHEME.concat(
    Joi.object().keys({
      conditions: CONDITIONS_SCHEME,
    })
  ),
  params: {
    organisationId: Joi.number().required(),
  },
};
