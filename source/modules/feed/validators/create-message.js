import Joi from 'joi';

export default {
  payload: Joi.object().keys({
    text: Joi.string(),
    attachments: Joi.any(),
  }).or('text', 'attachments'),
};
