import Joi from 'joi';

export default {
  payload: {
    title: Joi.string().min(5),
  },
};
