import Joi from 'joi';

module.exports = {
  create: {
    params: {
      id: Joi.number(),
    },
    payload: {
      text: Joi.string().required(),
    },
  },
};
