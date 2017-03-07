import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    text: Joi.string().allow(null),
    files: Joi.any(),
  }).or('text', 'files'),
};
