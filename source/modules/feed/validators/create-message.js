const Joi = require('joi');

export default {
  payload: Joi.object().keys({
    text: Joi.string().allow(null).allow(''),
    files: Joi.any(),
    poll_question: Joi.string().rename('pollQuestion'),
    poll_options: Joi.array().items(Joi.string(), Joi.number()).rename('pollOptions'),
  }).disallow([null, {}]).and('pollQuestion', 'pollOptions'),
};
