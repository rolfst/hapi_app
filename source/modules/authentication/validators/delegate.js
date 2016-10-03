import Joi from 'joi';

export default {
  query: {
    refresh_token: Joi.string().required(),
  },
};
