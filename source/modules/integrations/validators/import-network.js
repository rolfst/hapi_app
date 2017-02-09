import Joi from 'joi';

export default {
  payload: {
    external_email: Joi.string().required(),
  },
};
