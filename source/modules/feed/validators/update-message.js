import Joi from 'joi';

export default {
  payload: {
    text: Joi.string().required(),
    attachments: Joi.any(),
  },
  params: {
    messageId: Joi.string().required(),
  },
};
