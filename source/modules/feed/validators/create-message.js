import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    text: Joi.string().allow(null).allow(''),
    files: Joi.any(),
    poll_question: Joi.string(),
    poll_options: Joi.array().items(Joi.string(), Joi.number()),
  }).disallow([null, {}]).and('poll_question', 'poll_options'),
};
