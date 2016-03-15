import Joi from 'joi';

module.exports = {
  create: {
    params: {
      id: Joi.number(),
    },
    payload: {
      body: Joi.string().required(),
    },
  },
};
