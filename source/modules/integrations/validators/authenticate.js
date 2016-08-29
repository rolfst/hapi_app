import Joi from 'joi';

export default {
  payload: {
    username: Joi.string().required(),
    password: Joi.string().required(),
  },
};
