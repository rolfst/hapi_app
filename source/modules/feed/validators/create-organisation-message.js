const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    text: Joi.string().allow(null).allow(''),
    files: Joi.any(),
    pollQuestion: Joi.string().label('poll_question'),
    pollOptions: Joi.array().items(Joi.string(), Joi.number()).label('poll_options'),
  })
    .rename('poll_question', 'pollQuestion')
    .rename('poll_options', 'pollOptions')
    .disallow([null, {}])
    .and('pollQuestion', 'pollOptions'),
  params: {
    organisationId: Joi.number().required(),
  },
};
