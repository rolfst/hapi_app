import Joi from 'joi';

export default {
  create: {
    params: {
      id: Joi.number(),
    },
    payload: {
      text: Joi.string().required(),
    },
  },
};
