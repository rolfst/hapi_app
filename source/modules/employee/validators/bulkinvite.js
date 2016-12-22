import Joi from 'joi';

export default {
  payload: {
    user_ids: Joi.array().allow(null),
  },
};
