import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    text: Joi.string(),
    files: Joi.any(),
  }).or('text', 'files'),
};
