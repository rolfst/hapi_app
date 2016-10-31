import Joi from 'joi';

export default {
  payload: {
    external_username: Joi.string().required(),
  },
};
