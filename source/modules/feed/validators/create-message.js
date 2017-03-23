const Joi = require('joi');

module.exports = {
  payload: Joi.object().keys({
    text: Joi.string().allow(null).allow(''),
    files: Joi.any(),
    pollQuestion: Joi.string(),
    pollOptions: Joi.array().items(Joi.string(), Joi.number()),
  })
    .rename('poll_question', 'pollQuestion')
    .rename('poll_options', 'pollOptions')
    .disallow([null, {}]).and('pollQuestion', 'pollOptions'),
};
