import Joi from 'joi';

export default {
  payload: {
    file: Joi.required(),
  },
};
