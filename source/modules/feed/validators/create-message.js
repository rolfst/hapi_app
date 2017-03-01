import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    text: Joi.string(),
    children: Joi.any(),
  }).or('text', 'children'),
};
