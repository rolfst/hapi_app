import Joi from 'joi';

export default {
  payload: {
    text: Joi.string().required(),
  },
};
